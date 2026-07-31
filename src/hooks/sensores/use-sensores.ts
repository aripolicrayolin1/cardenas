'use client';

import { useEffect, useState } from 'react';

import { suscribirSensores } from '@/services/sensores';
import { lecturaVacia, type LecturaSensores } from '@/config/sensor-schema';

/**
 * @fileOverview Lectura de sensores en tiempo real.
 *
 * Equivale a la capa `hooks/` de unus_v2: pone los estados de React (carga,
 * error, conexión) alrededor de una función de servicio. Antes esta suscripción
 * estaba copiada dentro de cuatro componentes distintos.
 */

export interface EstadoSensores {
  lectura: LecturaSensores;
  /** `true` cuando ha llegado al menos una lectura */
  conectado: boolean;
  /** Momento de la última lectura recibida, o `null` si aún no llegó ninguna */
  ultimaActualizacion: Date | null;
  error: Error | null;
}

/**
 * @param deviceId sensor a escuchar. Sin él (o `"default"`) escucha el ESP32
 *   único legacy; con un id, el sensor de esa finca. Al cambiar de finca, la
 *   suscripción se rehace sola y el estado se reinicia para no mostrar la
 *   lectura del sensor anterior mientras llega la del nuevo.
 */
export function useSensores(deviceId?: string | null): EstadoSensores {
  const [lectura, setLectura] = useState<LecturaSensores>(lecturaVacia);
  const [conectado, setConectado] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Reiniciar al cambiar de dispositivo: la lectura del sensor anterior no
    // debe quedarse en pantalla como si fuera la de la finca recién elegida.
    setLectura(lecturaVacia);
    setConectado(false);
    setUltimaActualizacion(null);

    const cancelar = suscribirSensores(
      {
        onLectura: (nueva) => {
          setLectura(nueva);
          setConectado(true);
          setUltimaActualizacion(nueva.recibidaEn);
          setError(null);
        },
        onAvisos: (avisos) => {
          console.warn('[sensores] Incidencias en el contrato:', avisos);
        },
        onError: (e) => {
          setError(e);
          setConectado(false);
        },
      },
      deviceId
    );

    return cancelar;
  }, [deviceId]);

  return { lectura, conectado, ultimaActualizacion, error };
}
