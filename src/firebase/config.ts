import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// NOTA: Reemplaza 'AIzaSyDummyKey_RealProject' con tu API Key real de la consola de Firebase.
// La encuentras en: Configuración del proyecto > General > Tus apps > Configuración del SDK web.
const firebaseConfig = {
  apiKey: "AIzaSyDummyKey_RealProject", 
  authDomain: "studio-3066950614-ac5b0.firebaseapp.com",
  projectId: "studio-3066950614-ac5b0",
  storageBucket: "studio-3066950614-ac5b0.appspot.com",
  messagingSenderId: "72338853613",
  appId: "1:72338853613:web:72338853613"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
