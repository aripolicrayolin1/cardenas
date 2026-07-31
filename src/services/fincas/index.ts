import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  type CollectionReference,
  type Timestamp,
} from 'firebase/firestore';

import { db } from '@/firebase/config';

/**
 * @fileOverview Fincas del usuario. Sin React.
 *
 * Antes estas llamadas a Firestore vivían dentro del componente de página,
 * mezcladas con el JSX. Equivale a escribir SQL dentro de un router de FastAPI.
 */

export interface Finca {
  id: string;
  name: string;
  location: string;
  crop: string;
  area: string;
  userId: string;
  status: string;
  createdAt?: Timestamp;
  /**
   * Coordenadas de la parcela, para situarla en el mapa satelital.
   *
   * Son opcionales a propósito: las fincas registradas antes de que existiera
   * el mapa no las tienen, y capturar el GPS requiere un permiso del navegador
   * que el agricultor puede negar. Sin coordenadas la finca sigue siendo
   * válida; simplemente no aparece en el mapa.
   */
  lat?: number;
  lng?: number;
  /**
   * Identificador del sensor (ESP32) vinculado a esta parcela. Sin él, la finca
   * lee el dispositivo único legacy `/sensores`; con él, lee su propio sensor en
   * `/dispositivos/{deviceId}`. Así cada parcela puede tener su hardware.
   */
  deviceId?: string;
}

export interface NuevaFinca {
  name: string;
  location: string;
  crop: string;
  area: string;
  lat?: number;
  lng?: number;
  deviceId?: string;
}

/** Error de validación de negocio: lo provoca el usuario, no un fallo técnico. */
export class FincaInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'FincaInvalidaError';
  }
}

const LIMITES = {
  nombre: 120,
  ubicacion: 120,
  cultivo: 80,
  area: 40,
} as const;

/**
 * Referencia a la subcolección de fincas del usuario.
 * Devuelve `null` sin sesión, para que los hooks puedan no suscribirse.
 */
export function fincasRef(uid: string | undefined): CollectionReference | null {
  if (!uid) return null;
  return collection(db, 'users', uid, 'farms');
}

/**
 * Valida los datos del formulario. Se hace aquí, no en el componente, para que
 * la regla sea la misma venga de donde venga la llamada.
 *
 * Las mismas restricciones están replicadas en `firestore.rules`: la validación
 * de cliente es comodidad, la del servidor es la que manda.
 */
export function validarNuevaFinca(datos: NuevaFinca): NuevaFinca {
  const name = datos.name.trim();
  const location = datos.location.trim();
  const crop = datos.crop.trim();
  const area = datos.area.trim();

  if (!name || !location || !crop) {
    throw new FincaInvalidaError('El nombre, la ubicación y el cultivo son obligatorios.');
  }

  if (name.length > LIMITES.nombre) {
    throw new FincaInvalidaError(`El nombre no puede pasar de ${LIMITES.nombre} caracteres.`);
  }
  if (location.length > LIMITES.ubicacion) {
    throw new FincaInvalidaError(`La ubicación no puede pasar de ${LIMITES.ubicacion} caracteres.`);
  }
  if (crop.length > LIMITES.cultivo) {
    throw new FincaInvalidaError(`El cultivo no puede pasar de ${LIMITES.cultivo} caracteres.`);
  }
  if (area.length > LIMITES.area) {
    throw new FincaInvalidaError(`El área no puede pasar de ${LIMITES.area} caracteres.`);
  }

  const limpios: NuevaFinca = { name, location, crop, area: area || 'No especificada' };

  // Sólo se guardan si el par completo es válido. Una latitud sin longitud no
  // sitúa nada, y Firestore rechaza `undefined`: hay que omitir el campo, no
  // escribirlo vacío.
  if (esCoordenadaValida(datos.lat, datos.lng)) {
    limpios.lat = datos.lat;
    limpios.lng = datos.lng;
  }

  // El id del sensor se normaliza: sólo letras, números, guiones y guiones
  // bajos (lo que admite una clave de RTDB). Vacío = usa el dispositivo legacy.
  const deviceId = (datos.deviceId ?? '').trim();
  if (deviceId) {
    if (!/^[A-Za-z0-9_-]{1,60}$/.test(deviceId)) {
      throw new FincaInvalidaError(
        'El ID del sensor solo admite letras, números, guiones y guion bajo (máx. 60).'
      );
    }
    limpios.deviceId = deviceId;
  }

  return limpios;
}

/** `true` si el par forma una coordenada terrestre real. */
export function esCoordenadaValida(lat?: number, lng?: number): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    // (0, 0) cae en el Atlántico frente a África: es el valor que produce un
    // GPS que falló, nunca una parcela de Hidalgo.
    !(lat === 0 && lng === 0)
  );
}

/**
 * Crea una finca y espera a que Firestore confirme.
 *
 * El identificador lo genera `addDoc`. Antes se usaba
 * `Math.random().toString(36).substr(2, 9)`, que además de emplear un método
 * obsoleto puede colisionar.
 */
export async function crearFinca(uid: string, datos: NuevaFinca): Promise<string> {
  const ref = fincasRef(uid);
  if (!ref) throw new Error('Hace falta iniciar sesión para registrar una finca.');

  const limpios = validarNuevaFinca(datos);

  const documento = await addDoc(ref, {
    ...limpios,
    userId: uid,
    status: 'Saludable',
    createdAt: serverTimestamp(),
  });

  return documento.id;
}

export async function actualizarFinca(
  uid: string,
  fincaId: string,
  cambios: Partial<NuevaFinca>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'farms', fincaId), cambios);
}

export async function eliminarFinca(uid: string, fincaId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'farms', fincaId));
}
