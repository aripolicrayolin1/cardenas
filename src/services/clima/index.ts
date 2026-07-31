import { TEMP } from '@/config/constants';

/**
 * @fileOverview Pronóstico del tiempo desde Open-Meteo. Sin React, sin API key.
 *
 * Open-Meteo (https://open-meteo.com) publica pronóstico gratuito y sin clave,
 * solo pide atribución. A diferencia del resto del núcleo de la app —que
 * funciona sin conexión—, el pronóstico necesita internet por naturaleza: es
 * información regional que no está en los sensores de la parcela. Cuando no hay
 * red, quien consuma esto debe degradar con gracia, no romperse.
 *
 * Los sensores miden el AHORA de la parcela; el pronóstico añade el QUÉ VIENE,
 * que es sobre lo que un agricultor realmente planifica: cuándo cubrir por
 * helada, cuándo va a subir la humedad y con ella el riesgo de hongos.
 */

/** Coordenadas por defecto: Tulancingo de Bravo, Hidalgo. */
export const TULANCINGO_COORDS = { lat: 20.0833, lng: -98.3667 };

export interface DiaPronostico {
  /** Fecha ISO (YYYY-MM-DD). */
  fecha: string;
  tempMin: number;
  tempMax: number;
  /** Probabilidad de lluvia en %, 0-100. */
  probLluvia: number;
  /** Humedad relativa media del día, 0-100. */
  humedadMedia: number;
  /**
   * Humedad de suelo pronosticada a 3-9 cm, en % (0-100). Open-Meteo la da como
   * fracción volumétrica (m³/m³, típicamente 0-0.5); se convierte a % para que
   * el agricultor la lea igual que la lectura del ESP32.
   */
  humedadSueloPct: number;
  /** Evapotranspiración de referencia FAO, mm/día. */
  et0: number;
  /** Índice UV máximo del día. */
  uvMax: number;
}

export interface Pronostico {
  dias: DiaPronostico[];
  /** Momento en que se consultó. */
  consultadoEn: Date;
}

interface RespuestaOpenMeteo {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    et0_fao_evapotranspiration?: number[];
    uv_index_max?: number[];
  };
  hourly?: {
    time?: string[];
    relative_humidity_2m?: number[];
    soil_moisture_3_to_9cm?: number[];
  };
}

/** Media por día natural de una serie horaria, alineada con su eje de tiempo. */
function mediaPorDia(tiempos: string[] | undefined, valores: number[] | undefined): Map<string, number> {
  const acumulado = new Map<string, { suma: number; n: number }>();

  const ts = tiempos ?? [];
  const vs = valores ?? [];

  for (let i = 0; i < ts.length; i++) {
    const dia = ts[i]?.slice(0, 10);
    const v = vs[i];
    if (!dia || typeof v !== 'number') continue;

    const actual = acumulado.get(dia) ?? { suma: 0, n: 0 };
    actual.suma += v;
    actual.n += 1;
    acumulado.set(dia, actual);
  }

  const medias = new Map<string, number>();
  for (const [dia, { suma, n }] of acumulado) {
    medias.set(dia, n > 0 ? suma / n : 0);
  }
  return medias;
}

/**
 * Trae el pronóstico de los próximos días para unas coordenadas.
 * Lanza si no hay red o la respuesta no trae datos diarios: el llamador debe
 * capturarlo y mostrar un estado sin conexión.
 */
export async function obtenerPronostico(
  lat: number,
  lng: number,
  dias = 3
): Promise<Pronostico> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,et0_fao_evapotranspiration,uv_index_max',
    hourly: 'relative_humidity_2m,soil_moisture_3_to_9cm',
    timezone: 'America/Mexico_City',
    forecast_days: String(dias),
  });

  const respuesta = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!respuesta.ok) {
    throw new Error(`Open-Meteo respondió ${respuesta.status}`);
  }

  const data: RespuestaOpenMeteo = await respuesta.json();
  const daily = data.daily;

  if (!daily?.time?.length) {
    throw new Error('El pronóstico llegó sin datos diarios.');
  }

  const humedades = mediaPorDia(data.hourly?.time, data.hourly?.relative_humidity_2m);
  const sueloFrac = mediaPorDia(data.hourly?.time, data.hourly?.soil_moisture_3_to_9cm);

  const listaDias: DiaPronostico[] = daily.time.map((fecha, i) => ({
    fecha,
    tempMin: daily.temperature_2m_min?.[i] ?? 0,
    tempMax: daily.temperature_2m_max?.[i] ?? 0,
    probLluvia: daily.precipitation_probability_max?.[i] ?? 0,
    humedadMedia: Math.round(humedades.get(fecha) ?? 0),
    // La fracción volumétrica del suelo (~0-0.5 m³/m³) se lleva a % saturación
    // aproximada dividiendo entre 0.5, el tope práctico de un suelo agrícola.
    humedadSueloPct: Math.round(Math.min(100, ((sueloFrac.get(fecha) ?? 0) / 0.5) * 100)),
    et0: Number((daily.et0_fao_evapotranspiration?.[i] ?? 0).toFixed(1)),
    uvMax: Math.round(daily.uv_index_max?.[i] ?? 0),
  }));

  return { dias: listaDias, consultadoEn: new Date() };
}

// =============================================================================
// Interpretación agronómica del pronóstico
// =============================================================================

export type RiesgoHelada = 'ninguno' | 'posible' | 'alto';

export interface AvisoHelada {
  riesgo: RiesgoHelada;
  /** El día con la mínima más baja dentro de la ventana evaluada. */
  dia: DiaPronostico | null;
}

/**
 * Evalúa el riesgo de helada en las próximas noches. En el Valle es el evento
 * que arruina una cosecha en una madrugada, así que anticiparlo es lo más
 * valioso que puede hacer el pronóstico.
 *
 * Usa los mismos umbrales que el resto del sistema (`TEMP.HELADA`): por debajo
 * es helada; hasta 3 °C por encima, riesgo posible (basta un microclima local
 * para cruzar el umbral).
 */
export function evaluarHelada(pronostico: Pronostico, noches = 2): AvisoHelada {
  const ventana = pronostico.dias.slice(0, noches);
  if (ventana.length === 0) return { riesgo: 'ninguno', dia: null };

  const masFrio = ventana.reduce((min, d) => (d.tempMin < min.tempMin ? d : min));

  let riesgo: RiesgoHelada = 'ninguno';
  if (masFrio.tempMin <= TEMP.HELADA) riesgo = 'alto';
  else if (masFrio.tempMin <= TEMP.HELADA + 3) riesgo = 'posible';

  return { riesgo, dia: riesgo === 'ninguno' ? null : masFrio };
}
