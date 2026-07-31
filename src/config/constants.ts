/**
 * @fileOverview Umbrales agronómicos y constantes del sistema.
 *
 * Estos valores estaban repartidos entre el firmware del ESP32 y la lógica de
 * diagnóstico de la app, con discrepancias reales (el firmware regaba con
 * `suelo < 800` mientras la app diagnosticaba sequía con `suelo < 600`).
 * A partir de aquí viven en un solo sitio, y el motor de plagas
 * (`src/lib/plagas/`) los consume.
 *
 * ⚠️ El firmware tiene su propia copia en C++. Si cambias un umbral aquí,
 *    cámbialo también en `esp-32-pio-wokwi-template/src/main.cpp`.
 */

// =============================================================================
// Sensor de humedad de suelo
// =============================================================================

/** Resolución del ADC del ESP32: `analogRead()` devuelve 0..4095. */
export const ADC_MAX = 4095;

/**
 * Por encima de este valor asumimos que la lectura es un valor ADC crudo y no
 * un porcentaje ya calculado. Es una heurística de transición: desaparecerá
 * cuando el firmware envíe `suelo_pct` directamente (Fase 2).
 */
export const SOIL_RAW_THRESHOLD = 100;

// =============================================================================
// Umbrales de temperatura (°C)
// =============================================================================

export const TEMP = {
  /** Riesgo de helada. Coincide con `t < 7.0` del firmware. */
  HELADA: 7,
  /** Bloqueo de absorción de fósforo por frío. */
  FRIO_BLOQUEO: 14,
  /** Estrés térmico severo. */
  CALOR_EXTREMO: 35,
  /** Rango óptimo de fotosíntesis. */
  OPTIMA_MIN: 20,
  OPTIMA_MAX: 28,
} as const;

// =============================================================================
// Umbrales de humedad relativa del aire (%)
// =============================================================================

export const HUMEDAD_AIRE = {
  /** Alerta de humedad del firmware (`h > 85`). */
  ALERTA: 85,
  /** Saturación: riesgo de germinación de esporas. */
  SATURACION: 90,
  /** Aire extremadamente seco. */
  MUY_SECO: 20,
} as const;

// =============================================================================
// Umbrales de humedad de suelo, en PORCENTAJE ya normalizado
// =============================================================================
// Antes se comparaba contra valores ADC crudos (600, 800, 1500, 3800) mezclados
// con textos que los mostraban como "%". Ahora todo es porcentaje.

export const HUMEDAD_SUELO_PCT = {
  /** Sequía: por debajo de esto la planta entra en modo supervivencia. */
  SEQUIA: 15,
  /** Umbral de riego del firmware (`suelo < 800` sobre 4095 ≈ 19.5 %). */
  RIEGO: 20,
  /** Capacidad de campo: rango ideal de agua y aire. */
  CAPACIDAD_CAMPO_MIN: 37,
  CAPACIDAD_CAMPO_MAX: 61,
  /** Riesgo de acumulación de sales. */
  SALINIDAD: 85,
  /** Saturación: asfixia radicular. */
  ANOXIA: 93,
} as const;

// =============================================================================
// Evapotranspiración (mm/día)
// =============================================================================

export const ET = {
  /** Estomas cerrados: la planta detuvo su crecimiento. */
  MINIMA: 1.0,
  /** Demanda evaporativa crítica. */
  MAXIMA: 6.0,
} as const;

// =============================================================================
// Realtime Database
// =============================================================================

export const RTDB_PATHS = {
  /**
   * Nodo del dispositivo ÚNICO (legacy). El ESP32 actual escribe aquí su última
   * lectura. Se conserva para no tener que reprogramar el dispositivo existente:
   * una finca sin `deviceId` lee de aquí.
   */
  SENSORES: 'sensores',
  /** Serie histórica del dispositivo único (legacy). */
  HISTORICO: 'historico',
  /**
   * Raíz de los dispositivos con identificador. Cuando hay varios sensores, cada
   * uno escribe en `dispositivos/{deviceId}/sensores` y `.../historico`. Así cada
   * finca lee SU sensor en vez de compartir uno global. Ver `docs/CONTRATO_SENSORES.md`.
   */
  DISPOSITIVOS: 'dispositivos',
} as const;

/** id reservado que significa "el dispositivo único legacy" (rutas planas). */
export const DEVICE_LEGACY = 'default';

/**
 * Ruta RTDB de la última lectura para un dispositivo.
 * `deviceId` vacío o `DEVICE_LEGACY` → nodo plano `/sensores` (ESP32 actual).
 * Cualquier otro id → `/dispositivos/{deviceId}/sensores`.
 */
export function rutaSensores(deviceId?: string | null): string {
  if (!deviceId || deviceId === DEVICE_LEGACY) return RTDB_PATHS.SENSORES;
  return `${RTDB_PATHS.DISPOSITIVOS}/${deviceId}/${RTDB_PATHS.SENSORES}`;
}

/** Ruta RTDB de la serie histórica para un dispositivo. Ver {@link rutaSensores}. */
export function rutaHistorico(deviceId?: string | null): string {
  if (!deviceId || deviceId === DEVICE_LEGACY) return RTDB_PATHS.HISTORICO;
  return `${RTDB_PATHS.DISPOSITIVOS}/${deviceId}/${RTDB_PATHS.HISTORICO}`;
}

/** Puntos que se retienen en memoria en la vista "Vivo". */
export const LIVE_HISTORY_POINTS = 15;
