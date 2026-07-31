import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  type CollectionReference,
  type Query,
  type Timestamp,
} from 'firebase/firestore';

import { db } from '@/firebase/config';
import type { Observacion } from '@/lib/plagas/calibracion';

/**
 * @fileOverview Observaciones de campo en Firestore. Sin React.
 *
 * Cada vez que el agricultor confirma o desmiente una predicción se guarda una
 * observación con las condiciones que medían los sensores en ese momento. Son
 * la materia prima de la calibración local (`lib/plagas/calibracion`).
 *
 * ── Por qué se guardan las observaciones y no el resultado ──────────────────
 * Podrían almacenarse los umbrales ya ajustados y ahorrarse el cálculo. No se
 * hace a propósito: guardando las observaciones crudas, el método de
 * calibración puede cambiar —afinar la fuerza del prior, añadir otra variable—
 * y recalcularse sobre el histórico completo sin migrar nada ni perder datos.
 * Además queda auditable: se puede reconstruir de dónde salió cada ajuste.
 *
 * Viven en `users/{uid}/observaciones`; sus reglas están en `firestore.rules`.
 */

/** Observación tal y como se guarda, con su parcela y su fecha. */
export interface ObservacionGuardada extends Observacion {
  id: string;
  /** Parcela a la que pertenece: la calibración es POR parcela. */
  fincaId: string;
  createdAt?: Timestamp;
}

export interface NuevaObservacion extends Observacion {
  fincaId: string;
}

export class ObservacionInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ObservacionInvalidaError';
  }
}

export function observacionesRef(uid: string): CollectionReference {
  return collection(db, 'users', uid, 'observaciones');
}

/**
 * Consulta de las observaciones de una parcela.
 *
 * Se filtra por finca en el servidor y NO se ordena por fecha en la misma
 * consulta: combinar `where` con `orderBy` sobre otro campo obligaría a crear
 * un índice compuesto en Firestore. Para unas decenas de observaciones por
 * parcela, ordenar en el cliente sale más barato que mantener ese índice.
 */
export function observacionesQuery(uid: string, fincaId: string): Query {
  return query(observacionesRef(uid), where('fincaId', '==', fincaId), limit(500));
}

/** Todas las observaciones del usuario, para vistas de resumen. */
export function todasLasObservacionesQuery(uid: string): Query {
  return query(observacionesRef(uid), orderBy('createdAt', 'desc'), limit(200));
}

export async function registrarObservacion(
  uid: string,
  datos: NuevaObservacion
): Promise<string> {
  const plagaId = datos.plagaId.trim();

  if (!plagaId) {
    throw new ObservacionInvalidaError('Falta la plaga que se observó.');
  }
  if (!datos.fincaId) {
    throw new ObservacionInvalidaError('Elige la parcela donde hiciste la observación.');
  }
  if (!Number.isFinite(datos.temperatura) || !Number.isFinite(datos.humedadAire)) {
    throw new ObservacionInvalidaError(
      'No hay lectura de sensores válida para acompañar la observación.'
    );
  }

  const documento = await addDoc(observacionesRef(uid), {
    fincaId: datos.fincaId,
    plagaId,
    presente: datos.presente === true,
    temperatura: datos.temperatura,
    humedadAire: datos.humedadAire,
    humedadSuelo: datos.humedadSuelo,
    puntajePredicho: datos.puntajePredicho,
    createdAt: serverTimestamp(),
  });

  return documento.id;
}

export async function eliminarObservacion(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'observaciones', id));
}
