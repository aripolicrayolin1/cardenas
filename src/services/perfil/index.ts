import { doc, getDoc, setDoc, type Timestamp } from 'firebase/firestore';

import { db } from '@/firebase/config';

/**
 * @fileOverview Perfil y preferencias del usuario en Firestore. Sin React.
 *
 * Antes el perfil vivía en `localStorage`, incoherente con el resto de la app
 * (fincas, mercado y alertas ya están en Firestore) y perdido al cambiar de
 * dispositivo. Ahora se guarda bajo el propio documento del usuario, que las
 * reglas ya protegen: `users/{uid}` sólo lo lee y escribe su dueño
 * (`firestore.rules`).
 */

export interface PreferenciasNotificacion {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface Perfil {
  name: string;
  phone: string;
  location: string;
  notifications: PreferenciasNotificacion;
}

/** Perfil vacío por defecto, para el primer uso. */
export function perfilVacio(): Perfil {
  return {
    name: '',
    phone: '',
    location: 'Tulancingo de Bravo, Hidalgo',
    notifications: { email: true, sms: false, push: true },
  };
}

interface DocumentoUsuario {
  perfil?: Partial<Perfil>;
  actualizadoEn?: Timestamp;
}

/** Lee el perfil del usuario. Devuelve `null` si aún no ha guardado ninguno. */
export async function leerPerfil(uid: string): Promise<Perfil | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;

  const data = snap.data() as DocumentoUsuario;
  if (!data.perfil) return null;

  const base = perfilVacio();
  return {
    name: data.perfil.name ?? base.name,
    phone: data.perfil.phone ?? base.phone,
    location: data.perfil.location ?? base.location,
    notifications: { ...base.notifications, ...(data.perfil.notifications ?? {}) },
  };
}

/**
 * Guarda el perfil con `merge` para no pisar las subcolecciones ni otros campos
 * del documento del usuario (las fincas cuelgan de `users/{uid}/farms`).
 */
export async function guardarPerfil(uid: string, perfil: Perfil): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    {
      perfil: {
        name: perfil.name.trim(),
        phone: perfil.phone.trim(),
        location: perfil.location.trim(),
        notifications: perfil.notifications,
      },
    },
    { merge: true }
  );
}
