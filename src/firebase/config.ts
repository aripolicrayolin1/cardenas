import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBWD6WwCUJLiKlbSgr0NYGppQtL3HnHpoM",
  authDomain: "studio-3066950614-ac5b0.firebaseapp.com",
  databaseURL: "https://studio-3066950614-ac5b0-default-rtdb.firebaseio.com",
  projectId: "studio-3066950614-ac5b0",
  storageBucket: "studio-3066950614-ac5b0.firebasestorage.app",
  messagingSenderId: "72338853613",
  appId: "1:72338853613:web:5be71eb7d0c5685f8d46e4"
};

// Inicialización única de la App
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicialización única de los servicios para evitar errores de duplicidad o promesas pendientes
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const rtdb: Database = getDatabase(app);

export { app, auth, db, rtdb };
