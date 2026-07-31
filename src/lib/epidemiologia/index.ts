import type { AlertaComunidad } from '@/services/comunidad/alertas';

/**
 * @fileOverview Análisis del frente de avance de un brote.
 *
 * Toma los reportes georreferenciados de la comunidad sobre una misma plaga y
 * estima hacia dónde se mueve, a qué velocidad y cuándo llegaría a una parcela
 * concreta. Es epidemiología vegetal: el mismo razonamiento con el que se sigue
 * un contagio, aplicado a un brote agrícola.
 *
 * ── Cómo se calcula ─────────────────────────────────────────────────────────
 * Se ajusta una recta por mínimos cuadrados a la posición en función del tiempo,
 * por separado en latitud y longitud. La pendiente de cada recta es la velocidad
 * en grados/día, que se convierte a km/día. El vector resultante da rumbo y
 * rapidez del frente.
 *
 * Se usa regresión sobre TODOS los puntos en vez de comparar el primer reporte
 * con el último: un solo reporte tardío y lejano —o uno mal ubicado— torcería
 * por completo la estimación. La regresión reparte ese error entre todas las
 * observaciones.
 *
 * ── Lo que este modelo NO sabe ──────────────────────────────────────────────
 * Extrapola en línea recta. Una plaga real avanza siguiendo el viento, los
 * cauces, los caminos y la distribución del cultivo, no una recta. Por eso el
 * resultado trae `confianza` y una dispersión medida: cuando los puntos no se
 * alinean, hay que decirlo en vez de dar una fecha con falsa precisión.
 */

/** Grados de latitud a kilómetros. Constante en todo el planeta. */
const KM_POR_GRADO_LAT = 111.32;

/** Grados de longitud a km: se estrecha con el coseno de la latitud. */
function kmPorGradoLng(latitud: number): number {
  return KM_POR_GRADO_LAT * Math.cos((latitud * Math.PI) / 180);
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export interface PuntoBrote {
  lat: number;
  lng: number;
  /** epoch ms del reporte. */
  ts: number;
}

export type ConfianzaFrente = 'alta' | 'media' | 'baja';

export interface FrenteBrote {
  /** Nombre de la plaga tal y como lo reportó la comunidad. */
  plaga: string;
  /** Cuántos reportes georreferenciados sostienen el análisis. */
  reportes: number;
  /** Días entre el primer y el último reporte. */
  diasObservados: number;

  /** Rapidez del frente en km/día. */
  velocidadKmDia: number;
  /** Rumbo en grados (0 = norte, 90 = este). */
  rumboGrados: number;
  /** Rumbo en palabras: "del norte", "del suroeste"… */
  rumboTexto: string;

  /** Posición estimada del frente hoy. */
  frenteActual: { lat: number; lng: number };

  confianza: ConfianzaFrente;
  /** Dispersión media de los reportes respecto a la recta ajustada, en km. */
  dispersionKm: number;
}

export interface LlegadaEstimada {
  /** Días hasta que el frente alcance la parcela. Negativo: ya la pasó. */
  dias: number;
  /** Distancia actual del frente a la parcela, en km. */
  distanciaKm: number;
  /** `true` si el frente se aleja en vez de acercarse. */
  seAleja: boolean;
}

// =============================================================================
// Utilidades geométricas
// =============================================================================

/** Distancia en km entre dos coordenadas (fórmula del haversine). */
export function distanciaKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Traduce un rumbo en grados a la dirección DESDE la que viene el frente. */
function rumboATexto(grados: number): string {
  // Se expresa como procedencia ("viene del norte") porque es como habla un
  // agricultor: importa de dónde llega la amenaza, no hacia dónde se va.
  const origen = (grados + 180) % 360;
  const puntos = [
    'del norte', 'del noreste', 'del este', 'del sureste',
    'del sur', 'del suroeste', 'del oeste', 'del noroeste',
  ];
  return puntos[Math.round(origen / 45) % 8];
}

/** Pendiente y ordenada de la recta de mínimos cuadrados y = a + b·x. */
function regresionLineal(xs: number[], ys: number[]): { a: number; b: number } {
  const n = xs.length;
  const mediaX = xs.reduce((s, v) => s + v, 0) / n;
  const mediaY = ys.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mediaX) * (ys[i] - mediaY);
    den += (xs[i] - mediaX) ** 2;
  }

  // den = 0 cuando todos los reportes son del mismo instante: sin variación en
  // el tiempo no hay velocidad que estimar.
  const b = den === 0 ? 0 : num / den;
  return { a: mediaY - b * mediaX, b };
}

// =============================================================================
// Análisis del frente
// =============================================================================

/** Mínimo de reportes para intentar un ajuste. Con dos puntos siempre sale una recta perfecta, y eso engaña. */
export const MINIMO_REPORTES = 3;

/**
 * Estima el frente de avance a partir de reportes georreferenciados.
 * Devuelve `null` si no hay datos suficientes para sostener una estimación.
 */
export function analizarFrente(plaga: string, puntos: PuntoBrote[]): FrenteBrote | null {
  if (puntos.length < MINIMO_REPORTES) return null;

  const ordenados = [...puntos].sort((p, q) => p.ts - q.ts);
  const t0 = ordenados[0].ts;
  const diasObservados = (ordenados[ordenados.length - 1].ts - t0) / MS_POR_DIA;

  // Sin recorrido temporal no se puede hablar de velocidad.
  if (diasObservados < 0.5) return null;

  const dias = ordenados.map((p) => (p.ts - t0) / MS_POR_DIA);
  const lats = ordenados.map((p) => p.lat);
  const lngs = ordenados.map((p) => p.lng);

  const ajusteLat = regresionLineal(dias, lats);
  const ajusteLng = regresionLineal(dias, lngs);

  const latMedia = lats.reduce((s, v) => s + v, 0) / lats.length;
  const kmLng = kmPorGradoLng(latMedia);

  // Velocidad en km/día por componente.
  const vLat = ajusteLat.b * KM_POR_GRADO_LAT;
  const vLng = ajusteLng.b * kmLng;
  const velocidadKmDia = Math.hypot(vLat, vLng);

  // Rumbo: 0 = norte, 90 = este.
  const rumboGrados = (((Math.atan2(vLng, vLat) * 180) / Math.PI) + 360) % 360;

  // Posición del frente hoy, según la recta ajustada.
  const diasHastaHoy = (Date.now() - t0) / MS_POR_DIA;
  const frenteActual = {
    lat: ajusteLat.a + ajusteLat.b * diasHastaHoy,
    lng: ajusteLng.a + ajusteLng.b * diasHastaHoy,
  };

  // Dispersión: cuánto se apartan los reportes de la recta, en km.
  let sumaError = 0;
  for (let i = 0; i < ordenados.length; i++) {
    const esperado = {
      lat: ajusteLat.a + ajusteLat.b * dias[i],
      lng: ajusteLng.a + ajusteLng.b * dias[i],
    };
    sumaError += distanciaKm(esperado, ordenados[i]);
  }
  const dispersionKm = sumaError / ordenados.length;

  // La confianza combina cuántos reportes hay con qué tan bien se alinean.
  let confianza: ConfianzaFrente = 'baja';
  if (ordenados.length >= 6 && dispersionKm < 2) confianza = 'alta';
  else if (ordenados.length >= 4 && dispersionKm < 5) confianza = 'media';

  return {
    plaga,
    reportes: ordenados.length,
    diasObservados,
    velocidadKmDia,
    rumboGrados,
    rumboTexto: rumboATexto(rumboGrados),
    frenteActual,
    confianza,
    dispersionKm,
  };
}

/**
 * Cuándo llegaría el frente a una parcela.
 *
 * Se proyecta el vector que va del frente a la parcela sobre la dirección de
 * avance: sólo la componente que apunta hacia la parcela acerca el brote. Si esa
 * componente es negativa, el frente se está alejando.
 */
export function estimarLlegada(
  frente: FrenteBrote,
  parcela: { lat: number; lng: number }
): LlegadaEstimada | null {
  if (frente.velocidadKmDia < 0.01) return null; // frente prácticamente quieto

  const latMedia = (frente.frenteActual.lat + parcela.lat) / 2;
  const kmLng = kmPorGradoLng(latMedia);

  // Vector frente → parcela, en km.
  const dx = (parcela.lng - frente.frenteActual.lng) * kmLng;
  const dy = (parcela.lat - frente.frenteActual.lat) * KM_POR_GRADO_LAT;

  // Vector unitario de avance.
  const rad = (frente.rumboGrados * Math.PI) / 180;
  const ux = Math.sin(rad);
  const uy = Math.cos(rad);

  // Proyección: cuánto de la separación está en la dirección del avance.
  const avance = dx * ux + dy * uy;
  const distanciaKm = Math.hypot(dx, dy);

  return {
    dias: avance / frente.velocidadKmDia,
    distanciaKm,
    seAleja: avance < 0,
  };
}

// =============================================================================
// Agrupación de reportes
// =============================================================================

/**
 * Normaliza el texto del reporte para agrupar variantes del mismo problema.
 * La comunidad escribe libre: "Gusano cogollero", "gusano  cogollero!!" y
 * "GUSANO COGOLLERO" son el mismo brote y deben contarse juntos.
 */
export function normalizarPlaga(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface BroteAnalizado {
  frente: FrenteBrote;
  puntos: PuntoBrote[];
}

/**
 * Analiza todas las alertas de la comunidad y devuelve los brotes que tienen
 * suficientes reportes georreferenciados, del más rápido al más lento.
 */
export function analizarBrotes(alertas: readonly AlertaComunidad[]): BroteAnalizado[] {
  const grupos = new Map<string, { etiqueta: string; puntos: PuntoBrote[] }>();

  for (const a of alertas) {
    const ts = a.createdAt?.toMillis?.();
    if (a.lat == null || a.lng == null || !ts) continue;

    const clave = normalizarPlaga(a.problem);
    if (!clave) continue;

    const grupo = grupos.get(clave) ?? { etiqueta: a.problem, puntos: [] };
    grupo.puntos.push({ lat: a.lat, lng: a.lng, ts });
    grupos.set(clave, grupo);
  }

  const brotes: BroteAnalizado[] = [];
  for (const { etiqueta, puntos } of grupos.values()) {
    const frente = analizarFrente(etiqueta, puntos);
    if (frente) brotes.push({ frente, puntos });
  }

  return brotes.sort((a, b) => b.frente.velocidadKmDia - a.frente.velocidadKmDia);
}
