import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración real obtenida de la consola de Firebase del usuario
const firebaseConfig = {
  apiKey: "AIzaSyBWD6WwCUJLiKlbSgr0NYGppQtL3HnHpoM",
  authDomain: "studio-3066950614-ac5b0.firebaseapp.com",
  databaseURL: "https://studio-3066950614-ac5b0-default-rtdb.firebaseio.com",
  projectId: "studio-3066950614-ac5b0",
  storageBucket: "studio-3066950614-ac5b0.firebasestorage.app",
  messagingSenderId: "72338853613",
  appId: "1:72338853613:web:5be71eb7d0c5685f8d46e4"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
