'use client';

import { useCallback, useMemo, useState } from 'react';

import { useUser } from '@/firebase/auth/use-user';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { ResultadoMutacion } from '@/hooks/resultado-mutacion';
import {
  alertasQuery,
  crearAlerta,
  eliminarAlerta,
  PublicacionInvalidaError,
  type AlertaComunidad,
  type NuevaAlerta,
} from '@/services/comunidad';

/**
 * @fileOverview Alertas comunitarias compartidas, con sus estados de React.
 *
 * Reemplaza el `localStorage` que antes hacía que cada quien viera solo sus
 * reportes. La lectura es en tiempo real (`useCollection`), así que una alerta
 * nueva aparece en el panel de todos sin recargar.
 */

const REPORTERO_POR_DEFECTO = 'Agricultor de Tulancingo';

export function useAlertas() {
  const { user } = useUser();
  const [guardando, setGuardando] = useState(false);

  // La lectura es pública (las reglas lo permiten), así que funciona con o sin
  // sesión: cualquiera ve el radar, pero solo un usuario con sesión reporta.
  const ref = useMemo(() => alertasQuery(), []);
  const { data: alertas, loading, error } = useCollection<AlertaComunidad>(ref);

  const reportar = useCallback(
    async (datos: NuevaAlerta): Promise<ResultadoMutacion<string>> => {
      if (!user) {
        return { valor: null, error: 'Inicia sesión para reportar un brote a la comunidad.' };
      }

      setGuardando(true);
      try {
        const id = await crearAlerta(user.uid, user.displayName || REPORTERO_POR_DEFECTO, datos);
        return { valor: id, error: null };
      } catch (e) {
        const mensaje =
          e instanceof PublicacionInvalidaError
            ? e.message
            : (e as { code?: string })?.code === 'permission-denied'
              ? 'Firestore rechazó el reporte. Revisa que las reglas estén desplegadas.'
              : 'No se pudo publicar el reporte. Revisa tu conexión.';
        if (!(e instanceof PublicacionInvalidaError)) console.error('[alertas]', e);
        return { valor: null, error: mensaje };
      } finally {
        setGuardando(false);
      }
    },
    [user]
  );

  const eliminar = useCallback(
    async (id: string): Promise<ResultadoMutacion<true>> => {
      setGuardando(true);
      try {
        await eliminarAlerta(id);
        return { valor: true, error: null };
      } catch (e) {
        console.error('[alertas]', e);
        return { valor: null, error: 'No se pudo eliminar el reporte.' };
      } finally {
        setGuardando(false);
      }
    },
    []
  );

  return {
    alertas,
    cargando: loading,
    error,
    guardando,
    reportar,
    eliminar,
    puedeReportar: Boolean(user),
    uid: user?.uid,
  };
}
