'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * Suscripción en tiempo real a una colección o consulta de Firestore.
 *
 * El parámetro es `Query<DocumentData>` y no `Query<T>` a propósito: así acepta
 * directamente una `CollectionReference` sin convertidor, y el tipo de dominio
 * se indica en la llamada — `useCollection<Finca>(ref)` — en vez de obligar a
 * cada consumidor a hacer un cast.
 *
 * ⚠️ `consulta` forma parte de las dependencias del efecto: si la creas dentro
 *    del render sin `useMemo`, esto se resuscribe en cada repintado.
 */
export function useCollection<T = DocumentData>(consulta: Query<DocumentData> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!consulta) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      consulta,
      (snapshot: QuerySnapshot<DocumentData>) => {
        setData(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as T));
        setError(null);
        setLoading(false);
      },
      (err) => {
        // ⚠️ El ORDEN de estas dos operaciones importa.
        //
        // El estado se actualiza ANTES de emitir. `errorEmitter.emit()` es
        // síncrono y su suscriptor (`FirebaseErrorListener`) relanza el error en
        // desarrollo para que salga en el overlay de Next. Esa excepción sube
        // por la pila hasta aquí, así que cualquier línea posterior al `emit`
        // no llega a ejecutarse.
        //
        // Cuando `setLoading(false)` estaba después, un permiso denegado dejaba
        // la interfaz clavada en "Sincronizando con Firebase…" indefinidamente
        // y ocultaba la causa real.
        setError(err);
        setLoading(false);

        const path = (consulta as any)._query?.path?.segments?.join('/') || 'query';

        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({ path, operation: 'list' })
        );
      }
    );

    return () => unsubscribe();
  }, [consulta]);

  return { data, loading, error };
}
