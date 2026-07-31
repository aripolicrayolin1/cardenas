'use client';

import { useEffect, useState } from 'react';

import { obtenerNormales, type NormalesClimaticas } from '@/services/agroclima';

/**
 * @fileOverview Normales climáticas de NASA POWER, con estado de React.
 *
 * Las normales son valores históricos que no cambian, así que se piden una vez.
 * Silencioso ante el error: el contexto histórico es un extra, y si NASA POWER
 * no responde, el resto del pronóstico sigue mostrándose igual.
 */

export function useAgroclima(coords?: { lat: number; lng: number } | null) {
  const [normales, setNormales] = useState<NormalesClimaticas | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    obtenerNormales(coords?.lat, coords?.lng)
      .then((n) => {
        if (!cancelado) setNormales(n);
      })
      .catch((e) => {
        console.warn('[agroclima] sin normales históricas:', e?.message);
        if (!cancelado) setNormales(null);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [coords?.lat, coords?.lng]);

  return { normales, cargando };
}
