'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  evaluarHelada,
  obtenerPronostico,
  TULANCINGO_COORDS,
  type AvisoHelada,
  type Pronostico,
} from '@/services/clima';

/**
 * @fileOverview Pronóstico del tiempo, con sus estados de React.
 *
 * El pronóstico necesita red, así que expone `error` explícito: la interfaz
 * debe decir "sin conexión al pronóstico" en vez de fingir datos. El resto de
 * la app (diagnóstico por sensores) sigue funcionando sin él.
 */

export interface EstadoClima {
  pronostico: Pronostico | null;
  helada: AvisoHelada | null;
  cargando: boolean;
  error: Error | null;
  recargar: () => void;
}

/**
 * @param coords Coordenadas de la finca; si no hay, se usa Tulancingo.
 */
export function useClima(coords?: { lat: number; lng: number } | null): EstadoClima {
  const { lat, lng } = coords ?? TULANCINGO_COORDS;

  const [pronostico, setPronostico] = useState<Pronostico | null>(null);
  const [helada, setHelada] = useState<AvisoHelada | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [intento, setIntento] = useState(0);

  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError(null);

    obtenerPronostico(lat, lng)
      .then((p) => {
        if (cancelado) return;
        setPronostico(p);
        setHelada(evaluarHelada(p));
      })
      .catch((e: Error) => {
        if (cancelado) return;
        setError(e);
        setPronostico(null);
        setHelada(null);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [lat, lng, intento]);

  return { pronostico, helada, cargando, error, recargar };
}
