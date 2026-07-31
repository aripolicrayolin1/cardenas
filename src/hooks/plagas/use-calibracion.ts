'use client';

import { useCallback, useMemo, useState } from 'react';

import { useUser } from '@/firebase/auth/use-user';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { ResultadoMutacion } from '@/hooks/resultado-mutacion';
import {
  observacionesQuery,
  registrarObservacion,
  eliminarObservacion,
  ObservacionInvalidaError,
  type NuevaObservacion,
  type ObservacionGuardada,
} from '@/services/calibracion';
import { CATALOGO_PLAGAS } from '@/lib/plagas/catalogo';
import { calibrarCatalogo, type EstadoCalibracion } from '@/lib/plagas/calibracion';

/**
 * @fileOverview Calibración del motor con las observaciones de una parcela.
 *
 * Devuelve el catálogo YA CALIBRADO, listo para pasárselo al motor, junto con
 * el estado de calibración de cada plaga para mostrarlo en la interfaz.
 *
 * Sin sesión o sin parcela elegida devuelve el catálogo original: la app
 * funciona igual, sólo que sin aprendizaje local.
 */

export function useCalibracion(fincaId?: string | null) {
  const { user } = useUser();
  const [guardando, setGuardando] = useState(false);

  const ref = useMemo(
    () => (user && fincaId ? observacionesQuery(user.uid, fincaId) : null),
    [user, fincaId]
  );

  const { data: observaciones, loading, error } = useCollection<ObservacionGuardada>(ref);

  // El catálogo calibrado se recalcula sólo cuando cambian las observaciones.
  const { plagas, estados } = useMemo(
    () => calibrarCatalogo(CATALOGO_PLAGAS, observaciones),
    [observaciones]
  );

  const registrar = useCallback(
    async (datos: Omit<NuevaObservacion, 'fincaId'>): Promise<ResultadoMutacion<string>> => {
      if (!user) {
        return { valor: null, error: 'Inicia sesión para registrar observaciones.' };
      }
      if (!fincaId) {
        return { valor: null, error: 'Elige primero la parcela donde observaste.' };
      }

      setGuardando(true);
      try {
        const id = await registrarObservacion(user.uid, { ...datos, fincaId });
        return { valor: id, error: null };
      } catch (e) {
        const mensaje =
          e instanceof ObservacionInvalidaError
            ? e.message
            : 'No se pudo guardar la observación.';
        if (!(e instanceof ObservacionInvalidaError)) console.error('[calibracion]', e);
        return { valor: null, error: mensaje };
      } finally {
        setGuardando(false);
      }
    },
    [user, fincaId]
  );

  const eliminar = useCallback(
    async (id: string): Promise<ResultadoMutacion<true>> => {
      if (!user) return { valor: null, error: 'Sin sesión.' };
      try {
        await eliminarObservacion(user.uid, id);
        return { valor: true, error: null };
      } catch (e) {
        console.error('[calibracion]', e);
        return { valor: null, error: 'No se pudo eliminar la observación.' };
      }
    },
    [user]
  );

  /** Resumen global: cuánto ha aprendido el modelo en esta parcela. */
  const resumen = useMemo(() => {
    const conDatos = [...estados.values()].filter((e) => e.total > 0);
    if (conDatos.length === 0) {
      return { plagasCalibradas: 0, observaciones: 0, precisionMedia: null as number | null };
    }

    const conPrecision = conDatos.filter((e) => e.precision !== null);
    return {
      plagasCalibradas: conDatos.length,
      observaciones: observaciones.length,
      precisionMedia:
        conPrecision.length > 0
          ? conPrecision.reduce((s, e) => s + (e.precision ?? 0), 0) / conPrecision.length
          : null,
    };
  }, [estados, observaciones.length]);

  return {
    /** Catálogo con las envolventes ya ajustadas a esta parcela. */
    catalogoCalibrado: plagas,
    /** Estado de calibración por plaga, para la interfaz. */
    estados: estados as ReadonlyMap<string, EstadoCalibracion>,
    observaciones,
    resumen,
    cargando: loading,
    error,
    guardando,
    registrar,
    eliminar,
    puedeCalibrar: Boolean(user && fincaId),
  };
}
