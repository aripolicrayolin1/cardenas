import { TULANCINGO_COORDS } from '@/services/clima';

/**
 * @fileOverview Normales climáticas históricas desde NASA POWER. Sin API key.
 *
 * NASA POWER (https://power.larc.nasa.gov) publica climatología satelital
 * gratuita y sin clave, pensada para agricultura ("community=AG"). Devuelve el
 * promedio de cada mes calculado sobre décadas de observación.
 *
 * Sirve para dar CONTEXTO a la lectura del momento: no es lo mismo 12 °C en
 * enero (normal) que 12 °C en julio (frío atípico). Comparar el presente contra
 * lo normal del mes es lo que convierte un número suelto en información útil, y
 * es algo que ni los sensores ni el pronóstico a 3 días pueden dar por sí solos.
 *
 * Necesita internet, como todo lo climático regional; el núcleo por sensores
 * sigue funcionando sin conexión.
 */

const MESES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
] as const;

export interface NormalMes {
  /** Temperatura media mensual histórica, °C. */
  tempMedia: number;
  /** Precipitación media mensual histórica, mm/día. */
  lluvia: number;
}

export interface NormalesClimaticas {
  /** Índice 0-11 → normal del mes. */
  meses: NormalMes[];
  consultadoEn: Date;
}

interface RespuestaNasa {
  properties?: {
    parameter?: {
      T2M?: Record<string, number>;
      PRECTOTCORR?: Record<string, number>;
    };
  };
}

/**
 * Trae las normales mensuales de temperatura y lluvia para unas coordenadas.
 * Lanza si no hay red o la respuesta viene incompleta.
 */
export async function obtenerNormales(
  lat = TULANCINGO_COORDS.lat,
  lng = TULANCINGO_COORDS.lng
): Promise<NormalesClimaticas> {
  const params = new URLSearchParams({
    parameters: 'T2M,PRECTOTCORR',
    community: 'AG',
    longitude: String(lng),
    latitude: String(lat),
    format: 'JSON',
  });

  const respuesta = await fetch(
    `https://power.larc.nasa.gov/api/temporal/climatology/point?${params}`
  );
  if (!respuesta.ok) {
    throw new Error(`NASA POWER respondió ${respuesta.status}`);
  }

  const data: RespuestaNasa = await respuesta.json();
  const t2m = data.properties?.parameter?.T2M;
  const prec = data.properties?.parameter?.PRECTOTCORR;

  if (!t2m) {
    throw new Error('NASA POWER no devolvió temperaturas.');
  }

  const meses: NormalMes[] = MESES.map((m) => ({
    tempMedia: Number((t2m[m] ?? 0).toFixed(1)),
    lluvia: Number((prec?.[m] ?? 0).toFixed(1)),
  }));

  return { meses, consultadoEn: new Date() };
}

// =============================================================================
// Comparación con el presente
// =============================================================================

export type Anomalia = 'muy_frio' | 'frio' | 'normal' | 'calido' | 'muy_calido';

export interface ComparacionNormal {
  /** Diferencia respecto a la media del mes: (+) más cálido, (−) más frío. */
  deltaTemp: number;
  anomalia: Anomalia;
  /** Frase lista para mostrar. */
  descripcion: string;
  normalMes: number;
}

/**
 * Compara la temperatura actual contra la normal del mes en curso.
 * `mesIndice` 0-11; si no se pasa, no se puede comparar y se devuelve `null`.
 */
export function compararConNormal(
  tempActual: number,
  normales: NormalesClimaticas,
  mesIndice: number
): ComparacionNormal | null {
  const normal = normales.meses[mesIndice];
  if (!normal) return null;

  const delta = tempActual - normal.tempMedia;

  let anomalia: Anomalia = 'normal';
  if (delta <= -5) anomalia = 'muy_frio';
  else if (delta <= -2) anomalia = 'frio';
  else if (delta >= 5) anomalia = 'muy_calido';
  else if (delta >= 2) anomalia = 'calido';

  const signo = delta >= 0 ? '+' : '';
  const descripcion =
    anomalia === 'normal'
      ? `Temperatura dentro de lo normal para este mes (media histórica ${normal.tempMedia} °C).`
      : `${Math.abs(delta).toFixed(1)} °C ${delta < 0 ? 'por debajo' : 'por encima'} de lo normal del mes (media histórica ${normal.tempMedia} °C, ${signo}${delta.toFixed(1)}).`;

  return { deltaTemp: delta, anomalia, descripcion, normalMes: normal.tempMedia };
}
