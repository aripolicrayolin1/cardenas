'use client';

import { useCallback, useMemo, useState } from 'react';

import { useUser } from '@/firebase/auth/use-user';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { ResultadoMutacion } from '@/hooks/resultado-mutacion';
import {
  bitacoraQuery,
  crearEntrada,
  eliminarEntrada,
  registrarEventoUnico,
  BitacoraInvalidaError,
  type EntradaBitacora,
  type NuevaEntrada,
} from '@/services/bitacora';

/**
 * @fileOverview Bitácora de la parcela, con sus estados de React.
 *
 * La lectura es en tiempo real: una entrada nueva —manual o automática—
 * aparece sin recargar. Requiere sesión, como las fincas.
 */

export function useBitacora() {
  const { user } = useUser();
  const [guardando, setGuardando] = useState(false);

  const ref = useMemo(() => (user ? bitacoraQuery(user.uid) : null), [user]);
  const { data: entradas, loading, error } = useCollection<EntradaBitacora>(ref);

  const anotar = useCallback(
    async (datos: NuevaEntrada): Promise<ResultadoMutacion<string>> => {
      if (!user) {
        return { valor: null, error: 'Inicia sesión para escribir en tu bitácora.' };
      }

      setGuardando(true);
      try {
        const id = await crearEntrada(user.uid, datos);
        return { valor: id, error: null };
      } catch (e) {
        const mensaje =
          e instanceof BitacoraInvalidaError ? e.message : 'No se pudo guardar la nota.';
        if (!(e instanceof BitacoraInvalidaError)) console.error('[bitacora]', e);
        return { valor: null, error: mensaje };
      } finally {
        setGuardando(false);
      }
    },
    [user]
  );

  const eliminar = useCallback(
    async (id: string): Promise<ResultadoMutacion<true>> => {
      if (!user) return { valor: null, error: 'Sin sesión.' };
      try {
        await eliminarEntrada(user.uid, id);
        return { valor: true, error: null };
      } catch (e) {
        console.error('[bitacora]', e);
        return { valor: null, error: 'No se pudo eliminar la nota.' };
      }
    },
    [user]
  );

  /**
   * Registra un evento automático sólo una vez por día. Se usa para que los
   * avisos que la app detecta en cada carga (helada, riego) no se dupliquen.
   */
  const registrarEvento = useCallback(
    async (datos: NuevaEntrada, claveDia: string) => {
      if (!user) return;
      try {
        await registrarEventoUnico(user.uid, datos, claveDia);
      } catch (e) {
        console.error('[bitacora] evento automático:', e);
      }
    },
    [user]
  );

  return {
    entradas,
    cargando: loading,
    error,
    guardando,
    anotar,
    eliminar,
    registrarEvento,
    puedeEscribir: Boolean(user),
    uid: user?.uid,
  };
}
