import type { LecturaSensores, PuntoHistorico } from '@/config/sensor-schema';
import type { Plaga } from './catalogo';
import { analizarRiesgoPlagas, type AnalisisPlagas, type EvaluacionPlaga, type NivelRiesgo } from './motor';

export * from './catalogo';
export * from './motor';

/**
 * @fileOverview API pública del motor de plagas y adaptador a la forma que ya
 * consume la interfaz.
 *
 * `analizarDesdeLectura` es lo que usan los componentes: recibe la lectura
 * normalizada del ESP32 y devuelve el análisis completo. `comoAnalisisLegado`
 * lo traduce al esquema que devolvía el flujo de Gemini, para que la tarjeta de
 * resultados siga funcionando sin reescribirla.
 */

// =============================================================================
// Entrada desde los sensores
// =============================================================================

export interface OpcionesAnalisis {
  /** Filtra el catálogo por cultivo de la finca. */
  cultivo?: string;
  /** Serie de `/historico` para acumular grados-día. */
  historico?: readonly PuntoHistorico[];
  /**
   * Catálogo a evaluar. Se usa para pasar el ya calibrado con las observaciones
   * de la parcela (`hooks/plagas/use-calibracion`). Sin él se evalúa el del
   * proyecto, con los umbrales de literatura.
   */
  catalogo?: readonly Plaga[];
}

/** Analiza el riesgo de plagas a partir de una lectura de sensores. */
export function analizarDesdeLectura(
  lectura: LecturaSensores,
  opciones: OpcionesAnalisis = {}
): AnalisisPlagas {
  return analizarRiesgoPlagas({
    temperatura: lectura.temperatura,
    humedadAire: lectura.humedadAire,
    humedadSuelo: lectura.humedadSuelo,
    puntoRocio: lectura.puntoRocio,
    evapotranspiracion: lectura.evapotranspiracion,
    cultivo: opciones.cultivo,
    historico: opciones.historico,
    catalogo: opciones.catalogo,
  });
}

// =============================================================================
// Adaptador al esquema anterior
// =============================================================================

/**
 * Esquema que devolvía el antiguo flujo de análisis con Gemini. Se conserva
 * porque la tarjeta de resultados (`pest-analysis-result.tsx`) ya renderiza esta
 * forma; el motor local produce este mismo objeto vía `comoAnalisisLegado`, así
 * que la interfaz no necesitó reescribirse al retirar Gemini de los sensores.
 */
export interface AnalisisLegado {
  pestSuitability: {
    isSuitable: boolean;
    overallRisk: 'bajo' | 'medio' | 'alto' | 'muy_alto';
    summary: string;
  };
  potentialPests: Array<{
    name: string;
    riskLevel: 'bajo' | 'medio' | 'alto';
    description: string;
  }>;
  recommendations: Array<{
    type: 'insecticida' | 'tratamiento_suelo' | 'preventivo';
    details: string;
    rationale: string;
  }>;
}

const NIVEL_A_LEGADO: Record<NivelRiesgo, 'bajo' | 'medio' | 'alto'> = {
  nulo: 'bajo',
  bajo: 'bajo',
  medio: 'medio',
  alto: 'alto',
};

/**
 * Elige el tipo de recomendación según qué organismo la origina. El esquema
 * anterior sólo admite tres categorías, así que las plagas de suelo caen en
 * `tratamiento_suelo`, los artrópodos en `insecticida` y todo lo demás
 * —incluidos hongos y medidas culturales— en `preventivo`.
 */
function tipoRecomendacion(ev: EvaluacionPlaga): AnalisisLegado['recommendations'][number]['type'] {
  if (ev.plaga.tipo === 'suelo') return 'tratamiento_suelo';
  if (ev.plaga.tipo === 'insecto' || ev.plaga.tipo === 'acaro') return 'insecticida';
  return 'preventivo';
}

/**
 * Traduce el análisis al esquema anterior.
 *
 * Las recomendaciones se emiten en el orden del Manejo Integrado de Plagas:
 * primero lo mecánico y lo biológico, y el control químico sólo para las plagas
 * que llegaron a riesgo alto. Es una decisión deliberada: el modelo no debe
 * empujar a aplicar un producto cuando la presión todavía es moderada.
 */
export function comoAnalisisLegado(analisis: AnalisisPlagas): AnalisisLegado {
  const relevantes = analisis.relevantes;
  const altas = relevantes.filter((e) => e.nivel === 'alto');

  // Varias especies simultáneas en riesgo alto son peor escenario que una sola.
  const overallRisk: AnalisisLegado['pestSuitability']['overallRisk'] =
    altas.length >= 2 ? 'muy_alto' : NIVEL_A_LEGADO[analisis.riesgoGeneral];

  const resumen =
    analisis.confianza === 'baja'
      ? `${analisis.resumen}\n\n⚠️ ${analisis.avisos.join(' ')}`
      : analisis.resumen;

  const potentialPests = relevantes.slice(0, 6).map((ev) => ({
    name: `${ev.plaga.nombreComun} (${ev.plaga.nombreCientifico})`,
    riskLevel: NIVEL_A_LEGADO[ev.nivel],
    description: `${ev.explicacion}\n\nQué buscar en campo: ${ev.plaga.senalesEnCampo.join('; ')}.`,
  }));

  const recommendations: AnalisisLegado['recommendations'] = [];

  for (const ev of relevantes.slice(0, 3)) {
    const { plaga } = ev;

    recommendations.push({
      type: 'preventivo',
      details: `${plaga.nombreComun} — control mecánico y cultural: ${plaga.control.mecanico.join('. ')}.`,
      rationale: `Primera línea del manejo integrado. ${ev.factores[0].detalle}`,
    });

    recommendations.push({
      type: tipoRecomendacion(ev),
      details: `${plaga.nombreComun} — control biológico: ${plaga.control.biologico.join('. ')}.`,
      rationale: 'Conserva la fauna benéfica y no genera resistencia.',
    });

    // El químico sólo aparece cuando el riesgo es alto de verdad.
    if (ev.nivel === 'alto') {
      recommendations.push({
        type: tipoRecomendacion(ev),
        details:
          `${plaga.nombreComun} — si el muestreo en campo confirma el umbral: ${plaga.control.quimico.join('. ')}. ` +
          `Respeta siempre la dosis de la etiqueta y el intervalo de seguridad; consulta a un técnico certificado.`,
        rationale:
          `Riesgo alto (${Math.round(ev.puntaje * 100)} % de aptitud climática). ` +
          `Confirma en campo antes de aplicar: el modelo predice condiciones, no presencia.`,
      });
    }
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'preventivo',
      details:
        'Sin presión sanitaria detectada. Aprovecha para labores de cultivo, muestreo de rutina y ' +
        'mantenimiento de trampas de monitoreo.',
      rationale: 'Ninguna especie del catálogo encuentra condiciones favorables en esta lectura.',
    });
  }

  return {
    pestSuitability: {
      isSuitable: relevantes.length > 0,
      overallRisk,
      summary: resumen,
    },
    potentialPests:
      potentialPests.length > 0
        ? potentialPests
        : [
            {
              name: 'Sin riesgo relevante',
              riskLevel: 'bajo' as const,
              description: analisis.resumen,
            },
          ],
    recommendations,
  };
}
