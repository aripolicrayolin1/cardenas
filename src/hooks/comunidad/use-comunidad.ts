'use client';

import { useCallback, useMemo, useState } from 'react';

import { useUser } from '@/firebase/auth/use-user';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { ResultadoMutacion } from '@/hooks/resultado-mutacion';
import {
  COLECCIONES,
  crearEmpleo,
  crearProducto,
  eliminarPublicacion,
  empleosRef,
  productosRef,
  PublicacionInvalidaError,
  type Empleo,
  type NuevoEmpleo,
  type NuevoProducto,
  type Producto,
} from '@/services/comunidad';

/**
 * @fileOverview Mercado y bolsa de empleo, con sus estados de React.
 *
 * Las mutaciones esperan confirmación de Firestore y devuelven un booleano, en
 * vez de disparar la escritura y anunciar el éxito acto seguido.
 */

const VENDEDOR_POR_DEFECTO = 'Agricultor de Hidalgo';
const EMPLEADOR_POR_DEFECTO = 'Rancho Local';

export function useComunidad() {
  const { user } = useUser();
  const [guardando, setGuardando] = useState(false);
  const [errorMutacion, setErrorMutacion] = useState<string | null>(null);

  const refProductos = useMemo(() => productosRef(), []);
  const refEmpleos = useMemo(() => empleosRef(), []);

  const { data: productos, loading: cargandoProductos } = useCollection<Producto>(refProductos);
  const { data: empleos, loading: cargandoEmpleos } = useCollection<Empleo>(refEmpleos);

  const fallar = useCallback((mensaje: string): ResultadoMutacion<never> => {
    setErrorMutacion(mensaje);
    return { valor: null, error: mensaje };
  }, []);

  const ejecutar = useCallback(
    async <T,>(accion: () => Promise<T>, porDefecto: string): Promise<ResultadoMutacion<T>> => {
      setGuardando(true);
      setErrorMutacion(null);
      try {
        return { valor: await accion(), error: null };
      } catch (e) {
        if (e instanceof PublicacionInvalidaError) {
          return fallar(e.message);
        }

        console.error('[comunidad]', e);

        const codigo = (e as { code?: string })?.code ?? '';
        if (codigo === 'permission-denied') {
          return fallar(
            'Firestore rechazó la escritura por permisos. Despliega las reglas con: firebase deploy --only firestore:rules'
          );
        }
        if (codigo === 'unavailable' || codigo === 'deadline-exceeded') {
          return fallar('Sin conexión con Firestore. Revisa tu red e inténtalo de nuevo.');
        }
        if (codigo === 'unauthenticated') {
          return fallar('Tu sesión caducó. Vuelve a iniciar sesión.');
        }

        return fallar(porDefecto);
      } finally {
        setGuardando(false);
      }
    },
    [fallar]
  );

  const publicarProducto = useCallback(
    async (datos: NuevoProducto) => {
      if (!user) return fallar('Inicia sesión para publicar.');
      return ejecutar(
        () => crearProducto(user.uid, user.displayName || VENDEDOR_POR_DEFECTO, datos),
        'No se pudo publicar el producto.'
      );
    },
    [user, ejecutar]
  );

  const publicarEmpleo = useCallback(
    async (datos: NuevoEmpleo) => {
      if (!user) return fallar('Inicia sesión para publicar.');
      return ejecutar(
        () => crearEmpleo(user.uid, user.displayName || EMPLEADOR_POR_DEFECTO, datos),
        'No se pudo publicar el empleo.'
      );
    },
    [user, ejecutar]
  );

  const eliminar = useCallback(
    (coleccion: (typeof COLECCIONES)[keyof typeof COLECCIONES], id: string) =>
      ejecutar(() => eliminarPublicacion(coleccion, id), 'No se pudo eliminar.'),
    [ejecutar]
  );

  return {
    productos,
    empleos,
    cargandoProductos,
    cargandoEmpleos,
    guardando,
    errorMutacion,
    limpiarErrorMutacion: useCallback(() => setErrorMutacion(null), []),
    publicarProducto,
    publicarEmpleo,
    eliminar,
    puedePublicar: Boolean(user),
    uid: user?.uid,
  };
}
