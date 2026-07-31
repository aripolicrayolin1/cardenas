'use client';

import { useCallback, useMemo, useState } from 'react';

import { useUser } from '@/firebase/auth/use-user';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { ResultadoMutacion } from '@/hooks/resultado-mutacion';
import {
  crearFinca,
  eliminarFinca,
  fincasRef,
  FincaInvalidaError,
  type Finca,
  type NuevaFinca,
} from '@/services/fincas';

/**
 * @fileOverview Fincas del usuario, con sus estados de React.
 *
 * Las mutaciones ESPERAN a que Firestore confirme antes de reportar éxito.
 * Antes eran fire-and-forget: el toast decía "Finca Registrada" aunque la
 * escritura fallara después.
 *
 * ⚠️ Las mutaciones devuelven el motivo del fallo EN EL RESULTADO, no sólo en
 *    el estado `errorMutacion`. Leer ese estado justo después de un `await`
 *    devuelve el valor del render anterior, porque React no aplica un `setState`
 *    de forma síncrona. Por eso la página mostraba siempre el mismo mensaje
 *    genérico aunque la causa real fuera otra —permisos, red— y el usuario
 *    revisaba el formulario buscando un error que no estaba ahí.
 *
 *    `errorMutacion` se mantiene para quien quiera mostrar el fallo de forma
 *    persistente en la interfaz.
 */

export interface EstadoFincas {
  fincas: Finca[];
  cargando: boolean;
  error: Error | null;
  /** `true` mientras hay una escritura en curso */
  guardando: boolean;
  /** Crea una finca. `valor` es el id; si falló, `error` explica por qué. */
  crear: (datos: NuevaFinca) => Promise<ResultadoMutacion<string>>;
  eliminar: (fincaId: string) => Promise<ResultadoMutacion<true>>;
  errorMutacion: string | null;
  limpiarErrorMutacion: () => void;
  /** `true` cuando no hay sesión: la interfaz debe invitar a entrar */
  requiereSesion: boolean;
}

export function useFincas(): EstadoFincas {
  const { user } = useUser();
  const [guardando, setGuardando] = useState(false);
  const [errorMutacion, setErrorMutacion] = useState<string | null>(null);

  // `useMemo` es imprescindible: `useCollection` se resuscribe cada vez que
  // cambia la referencia de la consulta.
  const ref = useMemo(() => fincasRef(user?.uid), [user?.uid]);

  const { data: fincas, loading, error } = useCollection<Finca>(ref);

  const fallar = useCallback((mensaje: string): ResultadoMutacion<never> => {
    setErrorMutacion(mensaje);
    return { valor: null, error: mensaje };
  }, []);

  const crear = useCallback(
    async (datos: NuevaFinca): Promise<ResultadoMutacion<string>> => {
      if (!user) return fallar('Inicia sesión para registrar una finca.');

      setGuardando(true);
      setErrorMutacion(null);

      try {
        return { valor: await crearFinca(user.uid, datos), error: null };
      } catch (e) {
        return fallar(mensajeDeError(e, 'No se pudo registrar la finca.'));
      } finally {
        setGuardando(false);
      }
    },
    [user, fallar]
  );

  const eliminar = useCallback(
    async (fincaId: string): Promise<ResultadoMutacion<true>> => {
      if (!user) return fallar('Inicia sesión para eliminar una finca.');

      setGuardando(true);
      setErrorMutacion(null);

      try {
        await eliminarFinca(user.uid, fincaId);
        return { valor: true, error: null };
      } catch (e) {
        return fallar(mensajeDeError(e, 'No se pudo eliminar la finca.'));
      } finally {
        setGuardando(false);
      }
    },
    [user, fallar]
  );

  return {
    fincas,
    cargando: loading,
    error,
    guardando,
    crear,
    eliminar,
    errorMutacion,
    limpiarErrorMutacion: useCallback(() => setErrorMutacion(null), []),
    requiereSesion: !user,
  };
}

/**
 * Los errores de validación llevan un mensaje pensado para el agricultor.
 *
 * Los de permisos se traducen aparte porque su causa habitual no está en el
 * dispositivo: las reglas de Firestore no se han desplegado. Decir "no se pudo
 * guardar" en ese caso manda a revisar el formulario, donde no hay nada que
 * corregir.
 */
function mensajeDeError(error: unknown, porDefecto: string): string {
  if (error instanceof FincaInvalidaError) return error.message;

  console.error('[fincas]', error);

  const codigo = (error as { code?: string })?.code ?? '';

  if (codigo === 'permission-denied') {
    return 'Firestore rechazó la escritura por permisos. Despliega las reglas con: firebase deploy --only firestore:rules';
  }
  if (codigo === 'unavailable' || codigo === 'deadline-exceeded') {
    return 'Sin conexión con Firestore. Revisa tu red e inténtalo de nuevo.';
  }
  if (codigo === 'unauthenticated') {
    return 'Tu sesión caducó. Vuelve a iniciar sesión.';
  }

  return porDefecto;
}
