import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";

import { publicEnv } from "@/config/env";

/**
 * Estos valores son públicos por diseño: el SDK de Firebase los incrusta en el
 * bundle y viajan al navegador en cualquier app web. Ocultarlos no aporta nada.
 * La seguridad real vive en `firestore.rules` y `database.rules.json`.
 *
 * Se leen de `config/env` para tener un solo sitio donde cambiar de proyecto
 * (dev / staging / producción) sin tocar código.
 */
const firebaseConfig = publicEnv.firebase;

// Inicialización única de la App
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicialización única de los servicios para evitar errores de duplicidad o promesas pendientes
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const rtdb: Database = getDatabase(app);

export { app, auth, db, rtdb };
