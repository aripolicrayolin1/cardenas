import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  type CollectionReference,
  type Timestamp,
} from 'firebase/firestore';

import { db } from '@/firebase/config';

/**
 * @fileOverview Mercado y bolsa de empleo comunitarios. Sin React.
 *
 * Estas colecciones son de RAÍZ y se comparten con la otra aplicación del mismo
 * proyecto Firebase, así que cualquier cambio de forma afecta a las dos.
 * Las reglas que las protegen están en `firestore.rules`.
 */

export const COLECCIONES = {
  productos: 'marketplace_products',
  empleos: 'job_postings',
  alertas: 'community_alerts',
} as const;

// Alertas comunitarias: servicio propio, re-exportado aquí para que todo lo de
// comunidad se importe desde `@/services/comunidad`.
export * from './alertas';

export interface Producto {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  userId: string;
  sellerName: string;
  imageUrl: string;
  /** WhatsApp/teléfono opcional para que un comprador pueda contactar. */
  contact?: string;
  createdAt?: Timestamp;
}

export interface Empleo {
  id: string;
  title: string;
  employer: string;
  employerName: string;
  salary: string;
  description: string;
  location: string;
  userId: string;
  /** WhatsApp/teléfono opcional para postularse a la vacante. */
  contact?: string;
  createdAt?: Timestamp;
}

/**
 * Normaliza un teléfono a solo dígitos para armar un enlace de WhatsApp.
 * Devuelve `''` si no hay un número usable (así el campo se omite en Firestore,
 * que rechaza `undefined`).
 */
export function normalizarContacto(valor?: string): string {
  if (!valor) return '';
  const digitos = valor.replace(/\D/g, '');
  return digitos.length >= 10 ? digitos : '';
}

export class PublicacionInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'PublicacionInvalidaError';
  }
}

export function productosRef(): CollectionReference {
  return collection(db, COLECCIONES.productos);
}

export function empleosRef(): CollectionReference {
  return collection(db, COLECCIONES.empleos);
}

// =============================================================================
// Productos
// =============================================================================

export interface NuevoProducto {
  name: string;
  price: string;
  description: string;
  category: string;
  contact?: string;
}

export async function crearProducto(
  uid: string,
  nombreVendedor: string,
  datos: NuevoProducto
): Promise<string> {
  const name = datos.name.trim();
  const precio = Number(datos.price);

  if (!name) {
    throw new PublicacionInvalidaError('Ponle un nombre al producto.');
  }
  if (name.length > 120) {
    throw new PublicacionInvalidaError('El nombre no puede pasar de 120 caracteres.');
  }
  if (!Number.isFinite(precio) || precio < 0) {
    throw new PublicacionInvalidaError('El precio tiene que ser un número positivo.');
  }
  if (precio > 1_000_000) {
    throw new PublicacionInvalidaError('El precio máximo es 1 000 000 MXN.');
  }

  const contacto = normalizarContacto(datos.contact);

  const documento = await addDoc(productosRef(), {
    name,
    price: precio,
    description: datos.description.trim(),
    category: datos.category.trim(),
    userId: uid,
    sellerName: nombreVendedor,
    createdAt: serverTimestamp(),
    imageUrl: 'https://picsum.photos/seed/product/400/300',
    // Solo se guarda si es un número usable: Firestore rechaza `undefined`.
    ...(contacto ? { contact: contacto } : {}),
  });

  return documento.id;
}

// =============================================================================
// Empleos
// =============================================================================

export interface NuevoEmpleo {
  title: string;
  employer: string;
  salary: string;
  description: string;
  location: string;
  contact?: string;
}

export async function crearEmpleo(
  uid: string,
  nombrePorDefecto: string,
  datos: NuevoEmpleo
): Promise<string> {
  const title = datos.title.trim();

  if (!title) {
    throw new PublicacionInvalidaError('Ponle un título a la vacante.');
  }
  if (title.length > 160) {
    throw new PublicacionInvalidaError('El título no puede pasar de 160 caracteres.');
  }

  const contacto = normalizarContacto(datos.contact);

  const documento = await addDoc(empleosRef(), {
    title,
    employer: datos.employer.trim(),
    employerName: datos.employer.trim() || nombrePorDefecto,
    salary: datos.salary.trim(),
    description: datos.description.trim(),
    location: datos.location.trim(),
    userId: uid,
    createdAt: serverTimestamp(),
    ...(contacto ? { contact: contacto } : {}),
  });

  return documento.id;
}

// =============================================================================

/**
 * Borra un documento de una colección comunitaria.
 *
 * Que el borrado sea legítimo lo decide `firestore.rules` comparando `userId`
 * con el usuario autenticado. Ocultar el botón en la interfaz no protege nada.
 */
export async function eliminarPublicacion(
  coleccion: (typeof COLECCIONES)[keyof typeof COLECCIONES],
  id: string
): Promise<void> {
  await deleteDoc(doc(db, coleccion, id));
}
