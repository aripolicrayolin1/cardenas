import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  type CollectionReference,
  type Query,
  type Timestamp,
} from 'firebase/firestore';

import { db } from '@/firebase/config';
import { COLECCIONES, PublicacionInvalidaError } from './index';

/**
 * @fileOverview Alertas comunitarias en Firestore. Sin React.
 *
 * Antes vivían en `localStorage`, así que cada agricultor veía solo sus propios
 * reportes: el "radar comunitario" no compartía nada. Ahora se guardan en la
 * colección `community_alerts`, cuyas reglas ya estaban desplegadas
 * (`firestore.rules`): lectura pública, y creación/borrado sólo del autor. Con
 * esto un brote reportado por un productor aparece en el panel de los demás.
 */

export type Severidad = 'alta' | 'media' | 'baja';

export const SEVERIDADES: readonly Severidad[] = ['alta', 'media', 'baja'] as const;

export interface AlertaComunidad {
  id: string;
  problem: string;
  crop: string;
  region: string;
  description: string;
  severity: Severidad;
  /** Coordenadas si quien reportó compartió su GPS; `null` si no. */
  lat: number | null;
  lng: number | null;
  userId: string;
  reporterName: string;
  createdAt?: Timestamp;
}

export interface NuevaAlerta {
  problem: string;
  crop: string;
  region: string;
  description: string;
  severity: Severidad;
  lat?: number | null;
  lng?: number | null;
}

export function alertasRef(): CollectionReference {
  return collection(db, COLECCIONES.alertas);
}

/** Consulta de las alertas más recientes, ordenadas de nueva a vieja. */
export function alertasQuery(): Query {
  return query(alertasRef(), orderBy('createdAt', 'desc'), limit(50));
}

function severidadValida(valor: unknown): Severidad {
  return SEVERIDADES.includes(valor as Severidad) ? (valor as Severidad) : 'media';
}

export async function crearAlerta(
  uid: string,
  reporterName: string,
  datos: NuevaAlerta
): Promise<string> {
  const problem = datos.problem.trim();

  // La regla de Firestore exige `problem` (1-200). Se valida también aquí para
  // dar un mensaje claro antes de la ida y vuelta al servidor.
  if (!problem) {
    throw new PublicacionInvalidaError('Dinos qué plaga o problema detectaste.');
  }
  if (problem.length > 200) {
    throw new PublicacionInvalidaError('La descripción del problema es demasiado larga.');
  }

  const tieneCoords =
    typeof datos.lat === 'number' &&
    typeof datos.lng === 'number' &&
    Number.isFinite(datos.lat) &&
    Number.isFinite(datos.lng);

  const documento = await addDoc(alertasRef(), {
    problem,
    crop: datos.crop.trim() || 'No especificado',
    region: datos.region.trim() || 'Hidalgo',
    description: datos.description.trim(),
    severity: severidadValida(datos.severity),
    userId: uid,
    reporterName,
    createdAt: serverTimestamp(),
    // Firestore rechaza `undefined`: sólo se escriben si son coordenadas reales.
    lat: tieneCoords ? datos.lat : null,
    lng: tieneCoords ? datos.lng : null,
  });

  return documento.id;
}

export async function eliminarAlerta(id: string): Promise<void> {
  await deleteDoc(doc(db, COLECCIONES.alertas, id));
}
