'use client';

import { useCallback, useEffect, useState } from 'react';

import { listarHistorico, type RangoHistorico } from '@/services/sensores';
import type { PuntoHistorico } from '@/config/sensor-schema';

/**
 * @fileOverview Serie histórica real de sensores.
 *
 * Sustituye a los datos sintéticos que generaba `monitoring/page.tsx` con
 * `Math.sin()` y `Math.random()` sobre el valor actual, presentados como
 * "Historial de Cultivo". Ahora vienen de `/historico`, que escribe el ESP32
 * con marca de tiempo del servidor.
 *
 * Si el nodo está vacío (firmware antiguo, o menos de un minuto encendido),
 * `puntos` es `[]` y `vacio` es `true`: la interfaz debe decirlo, no rellenar
 * el hueco con números inventados.
 */

export interface EstadoHistorico {
  puntos: PuntoHistorico[];
  cargando: boolean;
  error: Error | null;
  /** `true` cuando la consulta terminó bien pero no hay datos en el rango */
  vacio: boolean;
  recargar: () => void;
}

/**
 * @param rango ventana temporal.
 * @param deviceId sensor cuyo historial se lee; sin él, el ESP32 único legacy.
 */
export function useHistorico(rango: RangoHistorico, deviceId?: string | null): EstadoHistorico {
  const [puntos, setPuntos] = useState<PuntoHistorico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [contadorRecarga, setContadorRecarga] = useState(0);

  const recargar = useCallback(() => setContadorRecarga((n) => n + 1), []);

  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError(null);

    // `Date.now()` se pasa como argumento para que el servicio siga siendo
    // puro y testeable.
    listarHistorico(rango, Date.now(), deviceId)
      .then((resultado) => {
        if (cancelado) return;
        setPuntos(resultado);
      })
      .catch((e: Error) => {
        if (cancelado) return;
        setError(e);
        setPuntos([]);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [rango, contadorRecarga, deviceId]);

  return {
    puntos,
    cargando,
    error,
    vacio: !cargando && !error && puntos.length === 0,
    recargar,
  };
}
