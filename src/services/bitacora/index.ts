import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  getDocs,
  type CollectionReference,
  type Query,
  type Timestamp,
} from 'firebase/firestore';

import { db } from '@/firebase/config';

/**
 * @fileOverview Bitácora de la parcela en Firestore. Sin React.
 *
 * Es el diario de la finca: registra lo que la app detecta (helada, riego,
 * alertas de plaga) y lo que el agricultor apunta a mano. En una temporada se
 * vuelve el historial real de la parcela.
 *
 * Y tiene un segundo propósito, a futuro: cruzar "el {día} reporté {plaga}"
 * contra las lecturas de sensores de los días previos es exactamente el dataset
 * etiquetado, propio de Tulancingo, con el que se entrenará el modelo local.
 * Cada entrada de hoy es un dato de mañana.
 *
 * Vive bajo `users/{uid}/bitacora`; sus reglas están en `firestore.rules`.
 */

export type TipoEntrada = 'helada' | 'plaga' | 'riego' | 'nota' | 'sensor' | 'diagnostico';

export interface EntradaBitacora {
  id: string;
  tipo: TipoEntrada;
  texto: string;
  /** `true` si la generó la app, `false` si la escribió el agricultor. */
  automatica: boolean;
  createdAt?: Timestamp;
}

export interface NuevaEntrada {
  tipo: TipoEntrada;
  texto: string;
  automatica?: boolean;
}

export function bitacoraRef(uid: string): CollectionReference {
  return collection(db, 'users', uid, 'bitacora');
}

/** Consulta de las entradas más recientes. */
export function bitacoraQuery(uid: string): Query {
  return query(bitacoraRef(uid), orderBy('createdAt', 'desc'), limit(100));
}

export class BitacoraInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'BitacoraInvalidaError';
  }
}

export async function crearEntrada(uid: string, datos: NuevaEntrada): Promise<string> {
  const texto = datos.texto.trim();

  if (!texto) {
    throw new BitacoraInvalidaError('La nota no puede estar vacía.');
  }
  if (texto.length > 500) {
    throw new BitacoraInvalidaError('La nota es demasiado larga (máximo 500 caracteres).');
  }

  const documento = await addDoc(bitacoraRef(uid), {
    tipo: datos.tipo,
    texto,
    automatica: datos.automatica ?? false,
    createdAt: serverTimestamp(),
  });

  return documento.id;
}

export async function eliminarEntrada(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'bitacora', id));
}

/**
 * Registra un evento automático evitando duplicados en el mismo día.
 *
 * Los eventos de la app (p. ej. "riesgo de helada esta noche") se detectan en
 * cada carga; sin este control, se apuntaría el mismo aviso muchas veces al
 * día. Se busca en las entradas recientes una con la misma marca (`claveDia`)
 * y sólo se crea si no existe. Devuelve el id nuevo, o `null` si ya estaba.
 */
export async function registrarEventoUnico(
  uid: string,
  datos: NuevaEntrada,
  claveDia: string
): Promise<string | null> {
  const recientes = await getDocs(query(bitacoraRef(uid), orderBy('createdAt', 'desc'), limit(30)));

  const yaExiste = recientes.docs.some((d) => {
    const data = d.data();
    return data.automatica === true && typeof data.texto === 'string' && data.texto.includes(claveDia);
  });

  if (yaExiste) return null;

  return crearEntrada(uid, { ...datos, automatica: true });
}
