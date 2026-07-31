import { clamp, isRawAdcReading, normalizeSoilPercent, toNumber } from '@/lib/sensors';

/**
 * @fileOverview EL CONTRATO con el firmware del ESP32.
 *
 * Este archivo es la fuente de verdad de qué publica el dispositivo y con qué
 * forma. Antes no existía, y el resultado era `pest-analysis-tool.tsx`
 * adivinando el nombre de cada campo en runtime con cinco alternativas:
 *
 *   sensorData["Hum. Aire"] || sensorData["Humedad Aire"] || sensorData.humedad_aire
 *     || sensorData.humedad || sensorData.humidity || 0
 *
 * Firmware correspondiente:
 *   esp-32-pio-wokwi-template/src/main.cpp  →  publicarEstado()
 *
 * ┌───────────────────┬────────┬─────────────┬──────────────────────────┐
 * │ Campo             │ Tipo   │ Rango       │ Origen                   │
 * ├───────────────────┼────────┼─────────────┼──────────────────────────┤
 * │ temperatura       │ float  │ °C          │ DHT22                    │
 * │ humedad_aire      │ float  │ 0-100 %     │ DHT22                    │
 * │ humedad_suelo     │ int    │ 0-4095 ADC  │ potenciómetro / capacit. │
 * │ humedad_suelo_pct │ float  │ 0-100 %     │ normalizado en el ESP32  │
 * │ luz               │ float  │ 0-100 %     │ fotorresistencia (GPIO35)│
 * │ punto_rocio       │ float  │ °C          │ calculado (Magnus)       │
 * │ et                │ float  │ mm/día      │ calculado (Hargreaves)   │
 * │ estado            │ string │ 4 valores   │ lógica de control        │
 * └───────────────────┴────────┴─────────────┴──────────────────────────┘
 *
 * ⚠️ `uv` NUNCA EXISTIÓ. La app lo leía y se lo pasaba a la IA como
 *    `uvRadiation`, pero el firmware jamás lo escribió: siempre valía 0.
 *    La fotorresistencia estaba cableada al mismo pin (GPIO34) que el
 *    potenciómetro y ni siquiera se leía. En la Fase 2 se movió a GPIO35 y
 *    ahora publica `luz`, que es lo que un LDR mide de verdad: luz visible,
 *    no radiación ultravioleta.
 *
 * `humedad_suelo` (ADC crudo) se sigue publicando por compatibilidad, pero
 * `humedad_suelo_pct` tiene prioridad cuando está presente.
 */

// =============================================================================
// Estados que emite el firmware
// =============================================================================

export const ESTADOS_SENSOR = [
  'SISTEMA NORMAL',
  'RIEGO ACTIVO',
  'ALERTA HUMEDAD',
  'ALERTA: RIESGO HELADA',
] as const;

export type EstadoSensor = (typeof ESTADOS_SENSOR)[number];

// =============================================================================
// Lectura cruda: exactamente lo que hay en /sensores
// =============================================================================

/**
 * Forma exacta del nodo `/sensores`. Todos los campos son opcionales a
 * propósito: si el dispositivo está arrancando el nodo puede estar incompleto,
 * y preferimos renderizar con ceros a romper el dashboard.
 */
export interface LecturaCruda {
  temperatura?: number;
  humedad_aire?: number;
  humedad_suelo?: number;
  humedad_suelo_pct?: number;
  luz?: number;
  punto_rocio?: number;
  et?: number;
  /** PIR (HC-SR501) en GPIO 27. Opcional: el firmware anterior no lo envía. */
  movimiento?: boolean;
  estado?: string;
}

/** Campos numéricos del contrato, en el orden en que los escribe el firmware. */
export const CAMPOS_NUMERICOS = [
  'temperatura',
  'humedad_aire',
  'humedad_suelo',
  'humedad_suelo_pct',
  'luz',
  'punto_rocio',
  'et',
] as const;

/** Campos sin los cuales el dashboard no tiene nada útil que mostrar. */
const CAMPOS_REQUERIDOS = ['temperatura', 'humedad_aire', 'humedad_suelo'] as const;

/**
 * Lee el objeto crudo del RTDB validando tipos, sin dependencias externas.
 * Un campo que no sea numérico se trata como ausente.
 */
function leerLecturaCruda(raw: unknown): { data: LecturaCruda; invalidos: string[] } {
  const data: LecturaCruda = {};
  const invalidos: string[] = [];

  if (typeof raw !== 'object' || raw === null) {
    return { data, invalidos };
  }

  const objeto = raw as Record<string, unknown>;

  for (const campo of CAMPOS_NUMERICOS) {
    const valor = objeto[campo];
    if (valor === undefined || valor === null) continue;

    const n = Number(valor);
    if (Number.isFinite(n)) {
      data[campo] = n;
    } else {
      invalidos.push(`"${campo}" no es numérico (${JSON.stringify(valor)}).`);
    }
  }

  if (typeof objeto.estado === 'string') {
    data.estado = objeto.estado;
  } else if (objeto.estado !== undefined) {
    invalidos.push('"estado" no es una cadena.');
  }

  // `movimiento` no entra en CAMPOS_NUMERICOS porque es booleano. Su ausencia
  // NO es un incumplimiento: un dispositivo sin PIR simplemente no lo publica.
  if (typeof objeto.movimiento === 'boolean') {
    data.movimiento = objeto.movimiento;
  } else if (objeto.movimiento !== undefined) {
    invalidos.push('"movimiento" no es booleano.');
  }

  return { data, invalidos };
}

// =============================================================================
// Lectura de dominio: lo que consume la aplicación
// =============================================================================

export interface LecturaSensores {
  /** °C */
  temperatura: number;
  /** % de humedad relativa del aire */
  humedadAire: number;
  /** % de humedad de suelo. Del campo `humedad_suelo_pct` si existe; si no, normalizado del ADC */
  humedadSuelo: number;
  /** Valor original del ADC, por si hace falta depurar */
  humedadSueloCruda: number;
  /** % de luz visible medida por la fotorresistencia. NO es radiación UV */
  luz: number;
  /** °C */
  puntoRocio: number;
  /** mm/día */
  evapotranspiracion: number;
  /** `true` mientras el PIR reporta presencia. `false` si no hay sensor. */
  movimiento: boolean;
  estado: string;
  /** Momento en que la app recibió la lectura (`/sensores` no lleva marca de tiempo) */
  recibidaEn: Date;
}

export interface ResultadoLectura {
  lectura: LecturaSensores;
  /** Incidencias del contrato: campos ausentes o fuera de rango */
  avisos: string[];
}

/**
 * Convierte el objeto crudo del RTDB en una lectura de dominio normalizada.
 * Nunca lanza: devuelve avisos para que la capa superior decida qué hacer.
 */
export function parseLecturaSensores(raw: unknown, recibidaEn: Date): ResultadoLectura {
  const { data, invalidos } = leerLecturaCruda(raw);
  const avisos: string[] = [...invalidos];

  for (const campo of CAMPOS_REQUERIDOS) {
    if (data[campo] === undefined) {
      avisos.push(`Falta "${campo}" en /sensores.`);
    }
  }

  const humedadSueloCruda = toNumber(data.humedad_suelo);

  // El firmware nuevo publica el porcentaje ya calculado; el viejo sólo el ADC.
  // Preferimos el porcentaje para no depender de la heurística de conversión.
  const humedadSuelo =
    data.humedad_suelo_pct !== undefined
      ? clamp(data.humedad_suelo_pct, 0, 100)
      : normalizeSoilPercent(humedadSueloCruda);

  if (
    data.humedad_suelo_pct === undefined &&
    data.humedad_suelo !== undefined &&
    !isRawAdcReading(humedadSueloCruda)
  ) {
    avisos.push(
      `"humedad_suelo" llegó como ${humedadSueloCruda}: se interpreta como porcentaje, no como ADC.`
    );
  }

  const estado = data.estado ?? 'SIN DATOS';

  if (data.estado !== undefined && !ESTADOS_SENSOR.includes(estado as EstadoSensor)) {
    avisos.push(`Estado desconocido: "${estado}".`);
  }

  return {
    lectura: {
      temperatura: toNumber(data.temperatura),
      humedadAire: toNumber(data.humedad_aire),
      humedadSuelo,
      humedadSueloCruda,
      luz: clamp(toNumber(data.luz), 0, 100),
      puntoRocio: toNumber(data.punto_rocio),
      evapotranspiracion: toNumber(data.et),
      movimiento: data.movimiento === true,
      estado,
      recibidaEn,
    },
    avisos,
  };
}

// =============================================================================
// Serie histórica: /historico/<pushId>
// =============================================================================

/**
 * Punto de la serie temporal. A diferencia de `/sensores`, sí lleva marca de
 * tiempo: la pone el servidor de Firebase con `.sv: "timestamp"`.
 */
export interface PuntoHistorico {
  /** epoch en milisegundos */
  ts: number;
  temperatura: number;
  humedadAire: number;
  humedadSuelo: number;
  puntoRocio: number;
  evapotranspiracion: number;
}

/**
 * Convierte un nodo de `/historico`. Devuelve `null` si el punto no tiene marca
 * de tiempo válida: sin ella no se puede situar en una gráfica.
 */
export function parsePuntoHistorico(raw: unknown): PuntoHistorico | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const objeto = raw as Record<string, unknown>;
  const ts = Number(objeto.ts);

  if (!Number.isFinite(ts) || ts <= 0) return null;

  return {
    ts,
    temperatura: toNumber(objeto.t),
    humedadAire: toNumber(objeto.h),
    humedadSuelo: clamp(toNumber(objeto.suelo_pct), 0, 100),
    puntoRocio: toNumber(objeto.td),
    evapotranspiracion: toNumber(objeto.et),
  };
}

/** Lectura vacía, para el estado inicial antes de conectar. */
export function lecturaVacia(): LecturaSensores {
  return {
    temperatura: 0,
    humedadAire: 0,
    humedadSuelo: 0,
    humedadSueloCruda: 0,
    luz: 0,
    puntoRocio: 0,
    evapotranspiracion: 0,
    movimiento: false,
    estado: 'Conectando...',
    recibidaEn: new Date(0),
  };
}
