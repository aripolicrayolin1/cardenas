import type { PuntoHistorico } from '@/config/sensor-schema';
import { clamp } from '@/lib/sensors';
import {
  CATALOGO_PLAGAS,
  plagasPorCultivo,
  type Plaga,
  type RangoOptimo,
} from './catalogo';

/**
 * @fileOverview MOTOR DE INFERENCIA — el modelo propiamente dicho.
 *
 * Recibe la lectura de los sensores y devuelve, para cada plaga del catálogo,
 * qué tan favorables son las condiciones actuales para su desarrollo. Todo el
 * cálculo es determinista y local: no hay red, no hay clave de API y no hay
 * texto generado. La misma entrada produce siempre la misma salida, que es
 * exactamente lo que se necesita para poder verificar y defender el resultado.
 *
 * ── Cómo funciona ───────────────────────────────────────────────────────────
 *
 * 1. APTITUD POR VARIABLE. Cada variable medida (temperatura, humedad del aire,
 *    humedad de suelo) se compara contra la envolvente de la plaga con una
 *    función trapezoidal que devuelve un valor entre 0 y 1.
 *
 * 2. HUMECTACIÓN FOLIAR. Ningún sensor la mide directamente, así que se estima
 *    por la convergencia entre temperatura del aire y punto de rocío: cuando se
 *    acercan, hay agua líquida condensando sobre la hoja. Es la variable que
 *    decide para royas y tizones.
 *
 * 3. COMBINACIÓN GEOMÉTRICA. Las aptitudes se combinan con una media geométrica
 *    ponderada, no aritmética. La diferencia importa: si una variable es 0
 *    —hace demasiado frío para la especie— el producto es 0 y el riesgo se
 *    anula, por muy favorables que estén las demás. Un promedio aritmético
 *    daría "riesgo medio" a una plaga que biológicamente no puede desarrollarse.
 *    La temperatura pesa más porque en organismos poiquilotermos es la variable
 *    maestra del desarrollo.
 *
 * 4. GRADOS-DÍA (opcional). Si se le pasa la serie de `/historico`, acumula
 *    grados-día por encima de la temperatura base de cada especie y estima en
 *    qué punto de su generación va. Sirve para anticipar la emergencia en lugar
 *    de sólo describir el presente.
 */

// =============================================================================
// Funciones de pertenencia
// =============================================================================

/**
 * Aptitud trapezoidal de un valor dentro de una envolvente. Devuelve 0 fuera de
 * [min, max], 1 dentro del óptimo e interpolación lineal en las rampas.
 */
export function aptitud(valor: number, rango: RangoOptimo): number {
  if (!Number.isFinite(valor)) return 0;
  if (valor <= rango.min || valor >= rango.max) return 0;
  if (valor >= rango.optimoMin && valor <= rango.optimoMax) return 1;

  if (valor < rango.optimoMin) {
    const ancho = rango.optimoMin - rango.min;
    return ancho <= 0 ? 1 : (valor - rango.min) / ancho;
  }

  const ancho = rango.max - rango.optimoMax;
  return ancho <= 0 ? 1 : (rango.max - valor) / ancho;
}

/**
 * Índice de humectación foliar estimado (0 a 1).
 *
 * No hay sensor de humectación en el ESP32, así que se deriva de dos señales
 * que sí se miden: la diferencia entre temperatura del aire y punto de rocío, y
 * la humedad relativa. Cuando la temperatura desciende hasta el punto de rocío,
 * el vapor condensa y aparece agua líquida sobre la hoja — que es la condición
 * que las esporas de roya y tizón necesitan para germinar.
 *
 * Se toma el menor de los dos indicadores: hace falta que AMBAS condiciones se
 * cumplan, no que baste una.
 */
export function indiceHumectacionFoliar(
  temperatura: number,
  puntoRocio: number,
  humedadAire: number
): number {
  if (!Number.isFinite(temperatura) || !Number.isFinite(puntoRocio)) return 0;

  // Separación entre temperatura y punto de rocío. A 0 °C hay condensación
  // franca; a partir de 5 °C de diferencia la hoja está seca.
  const delta = temperatura - puntoRocio;
  const porRocio = clamp(1 - delta / 5, 0, 1);

  // Por debajo de 80 % de HR no se sostiene agua libre; a 100 % es total.
  const porHumedad = clamp((humedadAire - 80) / 20, 0, 1);

  return Math.min(porRocio, porHumedad);
}

/**
 * Media geométrica ponderada. Un factor en 0 anula el resultado, que es
 * justamente la semántica biológica que se busca.
 */
function mediaGeometricaPonderada(factores: Array<{ valor: number; peso: number }>): number {
  const activos = factores.filter((f) => f.peso > 0);
  if (activos.length === 0) return 0;
  if (activos.some((f) => f.valor <= 0)) return 0;

  const pesoTotal = activos.reduce((suma, f) => suma + f.peso, 0);
  const logSuma = activos.reduce((suma, f) => suma + f.peso * Math.log(f.valor), 0);

  return Math.exp(logSuma / pesoTotal);
}

// =============================================================================
// Grados-día
// =============================================================================

/**
 * Acumula grados-día a partir de la serie histórica, agrupando por día natural
 * y aplicando el método del triángulo simple: GDD = (Tmáx + Tmín)/2 − Tbase,
 * acotado a cero.
 *
 * El día en curso se descarta porque está incompleto y su media sesgaría el
 * acumulado hacia la temperatura de la hora en que se consulte.
 */
export function acumularGradosDia(historico: readonly PuntoHistorico[], tempBase: number): number {
  if (historico.length === 0) return 0;

  const porDia = new Map<string, { min: number; max: number }>();

  for (const punto of historico) {
    if (!Number.isFinite(punto.ts) || !Number.isFinite(punto.temperatura)) continue;

    const fecha = new Date(punto.ts);
    const clave = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
    const actual = porDia.get(clave);

    if (!actual) {
      porDia.set(clave, { min: punto.temperatura, max: punto.temperatura });
    } else {
      actual.min = Math.min(actual.min, punto.temperatura);
      actual.max = Math.max(actual.max, punto.temperatura);
    }
  }

  const hoy = new Date();
  const claveHoy = `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}`;

  let total = 0;
  for (const [clave, { min, max }] of porDia) {
    if (clave === claveHoy) continue;
    total += Math.max(0, (min + max) / 2 - tempBase);
  }

  return total;
}

// =============================================================================
// Evaluación de una plaga
// =============================================================================

export type NivelRiesgo = 'nulo' | 'bajo' | 'medio' | 'alto';

export interface FactorEvaluado {
  nombre: string;
  aptitud: number;
  /** Explicación con los números reales de la lectura. */
  detalle: string;
}

export interface EvaluacionPlaga {
  plaga: Plaga;
  /** Puntaje combinado, 0 a 1. */
  puntaje: number;
  nivel: NivelRiesgo;
  factores: FactorEvaluado[];
  /** Por qué el motor llegó a este veredicto, en una frase. */
  explicacion: string;
  /** Sólo si se aportó historial y la especie tiene modelo de grados-día. */
  gradosDia?: {
    acumulados: number;
    generacionesEstimadas: number;
    /** Avance dentro de la generación en curso, 0 a 1. */
    progresoGeneracion: number;
  };
}

export interface CondicionesAmbientales {
  temperatura: number;
  humedadAire: number;
  humedadSuelo: number;
  puntoRocio: number;
  evapotranspiracion: number;
  /** Filtra el catálogo. Sin valor se evalúan todas las plagas. */
  cultivo?: string;
  /** Serie de `/historico` para el cálculo de grados-día. */
  historico?: readonly PuntoHistorico[];
  /**
   * Catálogo a evaluar. Sin valor se usa el del proyecto.
   *
   * Existe para poder pasar el catálogo YA CALIBRADO con las observaciones de
   * la parcela (ver `lib/plagas/calibracion`). El motor no sabe nada de
   * calibración: recibe envolventes y las evalúa, vengan del libro o corregidas
   * por los datos locales.
   */
  catalogo?: readonly Plaga[];
}

/** Pesos relativos de cada variable. La temperatura domina el desarrollo. */
const PESOS = {
  temperatura: 3,
  humedadAire: 2,
  humectacion: 2,
  humedadSuelo: 2,
} as const;

const UMBRALES_NIVEL = { alto: 0.7, medio: 0.45, bajo: 0.2 } as const;

function nivelDesdePuntaje(puntaje: number): NivelRiesgo {
  if (puntaje >= UMBRALES_NIVEL.alto) return 'alto';
  if (puntaje >= UMBRALES_NIVEL.medio) return 'medio';
  if (puntaje >= UMBRALES_NIVEL.bajo) return 'bajo';
  return 'nulo';
}

function describirAptitud(apt: number): string {
  if (apt >= 0.85) return 'óptima';
  if (apt >= 0.6) return 'favorable';
  if (apt >= 0.3) return 'marginal';
  if (apt > 0) return 'desfavorable';
  return 'fuera de rango';
}

/** Evalúa una plaga contra las condiciones actuales. */
export function evaluarPlaga(plaga: Plaga, cond: CondicionesAmbientales): EvaluacionPlaga {
  const factores: FactorEvaluado[] = [];
  const ponderados: Array<{ valor: number; peso: number }> = [];

  // ── Temperatura ──────────────────────────────────────────────────────────
  const aptTemp = aptitud(cond.temperatura, plaga.temperatura);
  factores.push({
    nombre: 'Temperatura',
    aptitud: aptTemp,
    detalle:
      `${cond.temperatura.toFixed(1)} °C frente al rango de desarrollo ` +
      `${plaga.temperatura.min}–${plaga.temperatura.max} °C ` +
      `(óptimo ${plaga.temperatura.optimoMin}–${plaga.temperatura.optimoMax} °C): ` +
      `${describirAptitud(aptTemp)}.`,
  });
  ponderados.push({ valor: aptTemp, peso: PESOS.temperatura });

  // ── Humedad del aire ─────────────────────────────────────────────────────
  const aptHum = aptitud(cond.humedadAire, plaga.humedadAire);
  factores.push({
    nombre: 'Humedad del aire',
    aptitud: aptHum,
    detalle:
      `${cond.humedadAire.toFixed(1)} % frente al rango ` +
      `${plaga.humedadAire.min}–${plaga.humedadAire.max} %: ${describirAptitud(aptHum)}.`,
  });
  ponderados.push({ valor: aptHum, peso: PESOS.humedadAire });

  // ── Humectación foliar (hongos y oomicetos) ──────────────────────────────
  const humectacion = indiceHumectacionFoliar(
    cond.temperatura,
    cond.puntoRocio,
    cond.humedadAire
  );

  if (plaga.humectacionFoliarHoras !== undefined) {
    factores.push({
      nombre: 'Humectación foliar',
      aptitud: humectacion,
      detalle:
        `La temperatura está a ${(cond.temperatura - cond.puntoRocio).toFixed(1)} °C del punto de ` +
        `rocío. La espora necesita cerca de ${plaga.humectacionFoliarHoras} h de agua libre sobre ` +
        `la hoja para infectar: condición ${describirAptitud(humectacion)}.`,
    });
    ponderados.push({ valor: humectacion, peso: PESOS.humectacion });
  } else if (plaga.inhibidaPorAguaLibre) {
    // Las cenicillas se comportan al revés: el agua libre inhibe la germinación.
    const aptSeca = 1 - humectacion;
    factores.push({
      nombre: 'Follaje seco',
      aptitud: aptSeca,
      detalle:
        `Esta especie necesita humedad ambiental alta pero hoja SECA; el agua libre inhibe ` +
        `su germinación. Índice de agua sobre la hoja: ${(humectacion * 100).toFixed(0)} %, ` +
        `por lo que la condición le resulta ${describirAptitud(aptSeca)}.`,
    });
    ponderados.push({ valor: aptSeca, peso: PESOS.humectacion });
  }

  // ── Humedad de suelo (plagas de suelo) ───────────────────────────────────
  if (plaga.humedadSuelo) {
    const aptSuelo = aptitud(cond.humedadSuelo, plaga.humedadSuelo);
    factores.push({
      nombre: 'Humedad de suelo',
      aptitud: aptSuelo,
      detalle:
        `${cond.humedadSuelo.toFixed(1)} % frente al rango ` +
        `${plaga.humedadSuelo.min}–${plaga.humedadSuelo.max} %: ${describirAptitud(aptSuelo)}.`,
    });
    ponderados.push({ valor: aptSuelo, peso: PESOS.humedadSuelo });
  }

  const puntaje = mediaGeometricaPonderada(ponderados);
  const nivel = nivelDesdePuntaje(puntaje);

  // ── Grados-día ───────────────────────────────────────────────────────────
  let gradosDia: EvaluacionPlaga['gradosDia'];
  if (plaga.gradosDia && cond.historico && cond.historico.length > 0) {
    const acumulados = acumularGradosDia(cond.historico, plaga.gradosDia.tempBase);
    const generacionesEstimadas = acumulados / plaga.gradosDia.porGeneracion;
    gradosDia = {
      acumulados,
      generacionesEstimadas,
      progresoGeneracion: generacionesEstimadas % 1,
    };
  }

  return {
    plaga,
    puntaje,
    nivel,
    factores,
    explicacion: construirExplicacion(plaga, nivel, factores, gradosDia),
    gradosDia,
  };
}

function construirExplicacion(
  plaga: Plaga,
  nivel: NivelRiesgo,
  factores: FactorEvaluado[],
  gradosDia?: EvaluacionPlaga['gradosDia']
): string {
  const limitante = [...factores].sort((a, b) => a.aptitud - b.aptitud)[0];

  if (nivel === 'nulo') {
    return (
      `Las condiciones actuales no permiten el desarrollo de ${plaga.nombreComun}. ` +
      `Factor limitante: ${limitante.nombre.toLowerCase()}. ${limitante.detalle}`
    );
  }

  const favorables = factores.filter((f) => f.aptitud >= 0.6).map((f) => f.nombre.toLowerCase());

  let texto: string;
  if (nivel === 'alto') {
    texto =
      `Condiciones favorables para ${plaga.nombreComun} (${plaga.nombreCientifico}). ` +
      (favorables.length > 0
        ? `Coinciden ${favorables.join(' y ')} dentro del rango que la especie necesita. `
        : '');
  } else if (nivel === 'medio') {
    texto =
      `Riesgo moderado de ${plaga.nombreComun}. Parte de las condiciones le favorecen, ` +
      `pero ${limitante.nombre.toLowerCase()} la está limitando. `;
  } else {
    texto =
      `Presión baja de ${plaga.nombreComun}. Las condiciones son poco propicias, ` +
      `principalmente por ${limitante.nombre.toLowerCase()}. `;
  }

  if (gradosDia && gradosDia.generacionesEstimadas >= 0.1) {
    const pct = Math.round(gradosDia.progresoGeneracion * 100);
    texto +=
      `Con ${Math.round(gradosDia.acumulados)} grados-día acumulados en el historial, la ` +
      `generación en curso va cerca del ${pct} % de su desarrollo.`;
  }

  return texto.trim();
}

// =============================================================================
// Análisis completo
// =============================================================================

export interface AnalisisPlagas {
  /** Evaluaciones ordenadas de mayor a menor riesgo. */
  evaluaciones: EvaluacionPlaga[];
  /** Sólo las que superan el umbral de riesgo bajo. */
  relevantes: EvaluacionPlaga[];
  riesgoGeneral: NivelRiesgo;
  resumen: string;
  /**
   * Baja cuando la lectura de los sensores es sospechosa (valores en cero o
   * fuera de rango físico). El motor prefiere avisar de que no confía en el
   * dato antes que emitir un diagnóstico seguro sobre una lectura rota.
   */
  confianza: 'alta' | 'baja';
  avisos: string[];
  evaluadoEn: Date;
}

/** Detecta lecturas que no pueden provenir de un sensor sano. */
function validarCondiciones(cond: CondicionesAmbientales): string[] {
  const avisos: string[] = [];

  if (cond.temperatura === 0 && cond.humedadAire === 0) {
    avisos.push('Temperatura y humedad llegaron en cero: el ESP32 podría estar desconectado.');
  }
  if (cond.temperatura < -20 || cond.temperatura > 60) {
    avisos.push(`Temperatura fuera de rango físico (${cond.temperatura} °C). Revisa el DHT22.`);
  }
  if (cond.humedadAire < 0 || cond.humedadAire > 100) {
    avisos.push(`Humedad del aire imposible (${cond.humedadAire} %). Revisa el DHT22.`);
  }
  if (cond.puntoRocio > cond.temperatura + 0.5) {
    avisos.push(
      'El punto de rocío es mayor que la temperatura del aire, lo cual es físicamente ' +
        'imposible. La estimación de humectación foliar no es fiable.'
    );
  }

  return avisos;
}

/**
 * Punto de entrada del motor: evalúa el catálogo completo contra la lectura
 * actual y devuelve el resultado ordenado por riesgo.
 */
export function analizarRiesgoPlagas(cond: CondicionesAmbientales): AnalisisPlagas {
  const avisos = validarCondiciones(cond);
  const catalogo = plagasPorCultivo(cond.cultivo, cond.catalogo);

  const evaluaciones = catalogo
    .map((plaga) => evaluarPlaga(plaga, cond))
    .sort((a, b) => b.puntaje - a.puntaje);

  const relevantes = evaluaciones.filter((e) => e.nivel !== 'nulo');
  const riesgoGeneral = relevantes.length > 0 ? relevantes[0].nivel : 'nulo';

  return {
    evaluaciones,
    relevantes,
    riesgoGeneral,
    resumen: construirResumen(relevantes, riesgoGeneral, cond),
    confianza: avisos.length > 0 ? 'baja' : 'alta',
    avisos,
    evaluadoEn: new Date(),
  };
}

function construirResumen(
  relevantes: EvaluacionPlaga[],
  riesgoGeneral: NivelRiesgo,
  cond: CondicionesAmbientales
): string {
  const lectura =
    `Lectura actual: ${cond.temperatura.toFixed(1)} °C, ` +
    `${cond.humedadAire.toFixed(1)} % de humedad en el aire, ` +
    `suelo al ${cond.humedadSuelo.toFixed(1)} % y punto de rocío en ` +
    `${cond.puntoRocio.toFixed(1)} °C.`;

  if (relevantes.length === 0) {
    return (
      `${lectura} Ninguna de las ${CATALOGO_PLAGAS.length} especies del catálogo encuentra ` +
      `condiciones para desarrollarse. Es un buen momento para labores de cultivo sin presión ` +
      `sanitaria.`
    );
  }

  const altas = relevantes.filter((e) => e.nivel === 'alto');
  const nombres = (lista: EvaluacionPlaga[]) =>
    lista.map((e) => e.plaga.nombreComun.toLowerCase()).join(', ');

  if (riesgoGeneral === 'alto') {
    return (
      `${lectura} Se detectaron condiciones favorables para ${altas.length} ` +
      `${altas.length === 1 ? 'especie' : 'especies'}: ${nombres(altas)}. ` +
      `Conviene salir a revisar el cultivo hoy mismo y confirmar en campo antes de aplicar nada.`
    );
  }

  if (riesgoGeneral === 'medio') {
    return (
      `${lectura} Hay presión moderada de ${nombres(relevantes.slice(0, 3))}. ` +
      `Ninguna condición es crítica todavía, pero conviene monitorear.`
    );
  }

  return (
    `${lectura} Presión sanitaria baja. Las especies con alguna probabilidad son ` +
    `${nombres(relevantes.slice(0, 3))}, todas lejos de su rango óptimo.`
  );
}
