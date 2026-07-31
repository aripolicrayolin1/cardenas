import {
  ref,
  onValue,
  query,
  orderByChild,
  startAt,
  limitToLast,
  get,
  type Unsubscribe,
} from 'firebase/database';

import { rtdb } from '@/firebase/config';
import { rutaSensores, rutaHistorico } from '@/config/constants';
import {
  parseLecturaSensores,
  parsePuntoHistorico,
  type LecturaSensores,
  type PuntoHistorico,
} from '@/config/sensor-schema';

/**
 * @fileOverview Acceso a los datos del ESP32. Sin React.
 *
 * Equivale a la capa `services/` de unus_v2: una función por operación, que
 * habla con el transporte (`firebase/config`) y devuelve tipos de dominio.
 * Los componentes nunca llaman a `ref()` ni a `onValue()` directamente.
 */

// =============================================================================
// Lectura actual
// =============================================================================

export interface SuscripcionSensores {
  onLectura: (lectura: LecturaSensores) => void;
  onAvisos?: (avisos: string[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Escucha la última lectura de un dispositivo en tiempo real. Devuelve la
 * función para cancelar.
 *
 * `deviceId` selecciona el sensor: sin él (o con `"default"`) lee el nodo plano
 * `/sensores` del ESP32 único actual; con un id lee `/dispositivos/{id}/sensores`.
 * Así una misma app sirve a varias parcelas, cada una con su propio sensor.
 *
 * El nodo no lleva marca de tiempo, así que la fecha de recepción la pone el
 * cliente. Para series temporales usa {@link listarHistorico}.
 */
export function suscribirSensores(
  { onLectura, onAvisos, onError }: SuscripcionSensores,
  deviceId?: string | null
): Unsubscribe {
  const nodo = ref(rtdb, rutaSensores(deviceId));

  return onValue(
    nodo,
    (snapshot) => {
      const valor = snapshot.val();
      if (!valor) return;

      const { lectura, avisos } = parseLecturaSensores(valor, new Date());

      if (avisos.length > 0) onAvisos?.(avisos);
      onLectura(lectura);
    },
    (error) => onError?.(error)
  );
}

// =============================================================================
// Serie histórica
// =============================================================================

/** Ventanas de tiempo que ofrece la interfaz. */
export type RangoHistorico = 'hoy' | 'semana';

const VENTANAS_MS: Record<RangoHistorico, number> = {
  hoy: 24 * 60 * 60 * 1000,
  semana: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Cuántos puntos como máximo se traen por rango. El firmware escribe uno por
 * minuto, así que una semana serían ~10 000 puntos: más de los que una gráfica
 * puede dibujar y más de los que conviene descargar con una conexión rural.
 */
const LIMITES: Record<RangoHistorico, number> = {
  hoy: 288, // ~1 punto cada 5 min
  semana: 336, // ~1 punto cada 30 min
};

/**
 * Lee la serie histórica del rango indicado, ordenada de más antigua a más
 * reciente.
 *
 * Requiere el índice `.indexOn: ["ts"]` en `database.rules.json`; sin él
 * Firebase ordenaría en el cliente tras descargar el nodo entero.
 */
export async function listarHistorico(
  rango: RangoHistorico,
  ahora: number,
  deviceId?: string | null
): Promise<PuntoHistorico[]> {
  const desde = ahora - VENTANAS_MS[rango];

  const consulta = query(
    ref(rtdb, rutaHistorico(deviceId)),
    orderByChild('ts'),
    startAt(desde),
    limitToLast(LIMITES[rango])
  );

  const snapshot = await get(consulta);
  if (!snapshot.exists()) return [];

  const puntos: PuntoHistorico[] = [];

  snapshot.forEach((hijo) => {
    const punto = parsePuntoHistorico(hijo.val());
    if (punto) puntos.push(punto);
  });

  return puntos.sort((a, b) => a.ts - b.ts);
}

/**
 * Reduce una serie a como mucho `maximo` puntos repartidos uniformemente,
 * conservando siempre el primero y el último. Dibujar 300 puntos en una tarjeta
 * de 200 px de alto no aporta nada y ralentiza el render.
 */
export function submuestrear<T>(puntos: T[], maximo: number): T[] {
  if (puntos.length <= maximo || maximo < 2) return puntos;

  const paso = (puntos.length - 1) / (maximo - 1);
  const salida: T[] = [];

  for (let i = 0; i < maximo; i++) {
    salida.push(puntos[Math.round(i * paso)]);
  }

  return salida;
}
