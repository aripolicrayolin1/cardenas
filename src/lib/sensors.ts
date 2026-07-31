import { ADC_MAX, SOIL_RAW_THRESHOLD } from '@/config/constants';

/**
 * @fileOverview Utilidades puras de sensores. Sin React, sin Firebase.
 *
 * La conversión de humedad de suelo estaba duplicada en tres archivos
 * (`monitoring/page.tsx`, `farms/page.tsx`, `sensor-stats.tsx`) con pequeñas
 * diferencias entre ellas. Aquí vive una sola vez.
 */

/**
 * Convierte la lectura de humedad de suelo a porcentaje 0-100.
 *
 * El ESP32 publica hoy el valor crudo del ADC (`analogRead`, 0-4095). Cuando el
 * firmware pase a enviar el porcentaje ya calculado (Fase 2), los valores
 * llegarán por debajo de {@link SOIL_RAW_THRESHOLD} y se devolverán tal cual.
 *
 * ⚠️ Los sensores capacitivos reales son INVERSOS: más agua produce una lectura
 *    más baja. Con el potenciómetro del simulador de Wokwi no se aprecia, pero
 *    con hardware real habrá que invertir la escala. Ver `invertirEscala`.
 */
export function normalizeSoilPercent(
  value: number,
  options: { invertirEscala?: boolean } = {}
): number {
  if (!Number.isFinite(value)) return 0;

  // Ya viene en porcentaje: sólo lo acotamos.
  if (value <= SOIL_RAW_THRESHOLD) {
    return clamp(value, 0, 100);
  }

  const ratio = clamp(value, 0, ADC_MAX) / ADC_MAX;
  const percent = (options.invertirEscala ? 1 - ratio : ratio) * 100;

  return clamp(percent, 0, 100);
}

/** `true` si la lectura parece un valor ADC crudo y no un porcentaje. */
export function isRawAdcReading(value: number): boolean {
  return Number.isFinite(value) && value > SOIL_RAW_THRESHOLD;
}

/**
 * Punto de rocío por la aproximación de Magnus-Tetens.
 * Es la misma fórmula que calcula el firmware; se replica aquí para poder
 * derivarlo si algún día la lectura no lo trae.
 */
export function dewPoint(tempC: number, humidityPct: number): number {
  if (!Number.isFinite(tempC) || !Number.isFinite(humidityPct)) return 0;

  const h = clamp(humidityPct, 0.1, 100);
  const alpha = (17.27 * tempC) / (237.7 + tempC) + Math.log(h / 100);

  return (237.7 * alpha) / (17.27 - alpha);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Convierte a número de forma segura: nunca devuelve NaN. */
export function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
