import type { Plaga, RangoOptimo } from './catalogo';

/**
 * @fileOverview Calibración local del motor: aprender de cada parcela.
 *
 * Las envolventes del catálogo vienen de literatura general (SENASICA, CABI,
 * EPPO). Son un punto de partida regional, no la verdad de una parcela
 * concreta: el microclima de un terreno en ladera, con sombra o junto a un
 * canal, corre los umbrales varios grados.
 *
 * Aquí el agricultor cierra el ciclo. Cuando el motor avisa, él va a revisar y
 * responde si la plaga estaba o no. Cada respuesta, junto con las condiciones
 * que medían los sensores en ese momento, se guarda como una observación. Con
 * ellas el modelo desplaza sus propios umbrales hacia lo que ocurre EN ESA
 * PARCELA.
 *
 * ── El método: encogimiento hacia el prior ──────────────────────────────────
 * No se sustituye la literatura por las observaciones, se mezclan con un peso
 * que depende de cuántas haya:
 *
 *     peso = n / (n + K)
 *     centro = (1 − peso) · centroLiteratura + peso · mediaObservada
 *
 * Con `n = 0` el peso es 0 y manda íntegra la literatura. Conforme llegan
 * observaciones el peso sube y el modelo se corre hacia los datos locales. `K`
 * es la fuerza del prior: cuántas observaciones hacen falta para que el dato
 * local pese lo mismo que el libro.
 *
 * Es un promedio ponderado bayesiano, y resuelve el problema real de este
 * escenario: con dos o tres observaciones, reemplazar los umbrales sin más
 * destruiría un modelo bueno a partir de ruido. El encogimiento deja que los
 * datos manden sólo cuando son suficientes para merecerlo.
 *
 * ── Límite de seguridad ─────────────────────────────────────────────────────
 * Además el desplazamiento se acota (`DESPLAZAMIENTO_MAXIMO`). Ni con cien
 * observaciones el modelo puede alejarse arbitrariamente de la biología
 * conocida: una plaga no se desarrolla a 45 °C porque alguien lo reportara mal
 * tres veces.
 */

/**
 * Fuerza del prior. Con 5 observaciones el dato local pesa lo mismo que la
 * literatura (peso = 5/10 = 0.5). Es un valor deliberadamente conservador para
 * una temporada agrícola, donde reunir observaciones es lento.
 */
export const FUERZA_PRIOR = 5;

/** Cuánto puede desplazarse un umbral respecto a la literatura, como máximo. */
export const DESPLAZAMIENTO_MAXIMO = {
  /** °C */
  temperatura: 4,
  /** puntos porcentuales */
  humedad: 12,
} as const;

/** Una observación de campo: qué dijo el agricultor y qué medían los sensores. */
export interface Observacion {
  plagaId: string;
  /** `true` si el agricultor confirmó la plaga; `false` si revisó y no había. */
  presente: boolean;
  temperatura: number;
  humedadAire: number;
  humedadSuelo: number;
  /** Puntaje que dio el modelo (0-1) cuando se hizo la predicción. */
  puntajePredicho: number;
}

export interface EstadoCalibracion {
  plagaId: string;
  /** Observaciones totales para esta plaga en esta parcela. */
  total: number;
  /** De ellas, cuántas confirmaron presencia. */
  confirmadas: number;
  /**
   * Cuánto pesa el dato local frente a la literatura, 0-1. Es el `peso` de la
   * fórmula de encogimiento; se muestra al usuario como "nivel de calibración".
   */
  peso: number;
  /** Aciertos del modelo sobre el total de observaciones, 0-1. `null` sin datos. */
  precision: number | null;
  /** Desplazamiento aplicado a la temperatura óptima, en °C. */
  ajusteTempC: number;
  /** Desplazamiento aplicado a la humedad óptima, en puntos. */
  ajusteHumedadPct: number;
}

// =============================================================================
// Cálculo
// =============================================================================

function media(valores: number[]): number {
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

function acotar(valor: number, limite: number): number {
  return Math.max(-limite, Math.min(limite, valor));
}

/** Centro del rango óptimo de una envolvente. */
function centro(rango: RangoOptimo): number {
  return (rango.optimoMin + rango.optimoMax) / 2;
}

/** Desplaza una envolvente completa manteniendo su forma. */
function desplazar(rango: RangoOptimo, delta: number): RangoOptimo {
  return {
    min: rango.min + delta,
    optimoMin: rango.optimoMin + delta,
    optimoMax: rango.optimoMax + delta,
    max: rango.max + delta,
  };
}

/**
 * Calcula el estado de calibración de una plaga a partir de sus observaciones.
 *
 * El desplazamiento se estima SÓLO con las observaciones que confirmaron
 * presencia: son las que dicen en qué condiciones aparece de verdad la plaga.
 * Las negativas no mueven los umbrales —una ausencia puede deberse a que el
 * agricultor ya trató el cultivo, no a que las condiciones fueran malas— pero
 * sí cuentan para medir la precisión del modelo.
 */
export function calcularCalibracion(
  plaga: Plaga,
  observaciones: readonly Observacion[]
): EstadoCalibracion {
  const propias = observaciones.filter((o) => o.plagaId === plaga.id);
  const confirmadas = propias.filter((o) => o.presente);

  const total = propias.length;
  const peso = total === 0 ? 0 : total / (total + FUERZA_PRIOR);

  // Precisión: ¿el modelo acertó? Se considera acierto cuando predijo alto
  // (≥ 0.45, el umbral de "riesgo medio") y la plaga estaba, o predijo bajo y
  // no estaba.
  const precision =
    total === 0
      ? null
      : propias.filter((o) => (o.puntajePredicho >= 0.45) === o.presente).length / total;

  let ajusteTempC = 0;
  let ajusteHumedadPct = 0;

  if (confirmadas.length > 0) {
    const pesoLocal = confirmadas.length / (confirmadas.length + FUERZA_PRIOR);

    const deltaTemp = media(confirmadas.map((o) => o.temperatura)) - centro(plaga.temperatura);
    const deltaHum = media(confirmadas.map((o) => o.humedadAire)) - centro(plaga.humedadAire);

    ajusteTempC = acotar(deltaTemp * pesoLocal, DESPLAZAMIENTO_MAXIMO.temperatura);
    ajusteHumedadPct = acotar(deltaHum * pesoLocal, DESPLAZAMIENTO_MAXIMO.humedad);
  }

  return {
    plagaId: plaga.id,
    total,
    confirmadas: confirmadas.length,
    peso,
    precision,
    ajusteTempC,
    ajusteHumedadPct,
  };
}

/**
 * Devuelve la ficha con sus envolventes ya desplazadas según la calibración.
 * Sin observaciones devuelve la ficha original sin copiarla.
 */
export function aplicarCalibracion(plaga: Plaga, estado: EstadoCalibracion | undefined): Plaga {
  if (!estado || (estado.ajusteTempC === 0 && estado.ajusteHumedadPct === 0)) {
    return plaga;
  }

  return {
    ...plaga,
    temperatura: desplazar(plaga.temperatura, estado.ajusteTempC),
    humedadAire: desplazar(plaga.humedadAire, estado.ajusteHumedadPct),
  };
}

/**
 * Calibra el catálogo entero de una vez.
 * `observaciones` son las de UNA parcela: la calibración es por parcela, no por
 * usuario, porque dos terrenos del mismo dueño pueden tener microclimas
 * distintos.
 */
export function calibrarCatalogo(
  catalogo: readonly Plaga[],
  observaciones: readonly Observacion[]
): { plagas: Plaga[]; estados: Map<string, EstadoCalibracion> } {
  const estados = new Map<string, EstadoCalibracion>();
  const plagas: Plaga[] = [];

  for (const plaga of catalogo) {
    const estado = calcularCalibracion(plaga, observaciones);
    estados.set(plaga.id, estado);
    plagas.push(aplicarCalibracion(plaga, estado));
  }

  return { plagas, estados };
}

/** Frase corta que explica el nivel de calibración a quien la lee. */
export function describirCalibracion(estado: EstadoCalibracion): string {
  if (estado.total === 0) {
    return 'Sin observaciones todavía: el modelo usa los umbrales de literatura.';
  }

  const pct = Math.round(estado.peso * 100);
  const partes = [
    `${estado.total} ${estado.total === 1 ? 'observación' : 'observaciones'} de tu parcela.`,
    `El modelo pondera tus datos al ${pct} % frente a la literatura.`,
  ];

  if (Math.abs(estado.ajusteTempC) >= 0.3) {
    const signo = estado.ajusteTempC > 0 ? 'más cálidas' : 'más frías';
    partes.push(`Aquí aparece en condiciones ${signo}: ${Math.abs(estado.ajusteTempC).toFixed(1)} °C de desplazamiento.`);
  }

  return partes.join(' ');
}
