import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

// ------------------------------------------------------------------
// CONFIGURACIÓN DE FIREBASE
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAQKOMqF1JZGTfPQwH3GjAt0hhQOKrk1DY",
  authDomain: "gestor-reclutamiento.firebaseapp.com",
  databaseURL: "https://gestor-reclutamiento-default-rtdb.firebaseio.com",
  projectId: "gestor-reclutamiento",
  storageBucket: "gestor-reclutamiento.firebasestorage.app",
  messagingSenderId: "177005324608",
  appId: "1:177005324608:web:7d871a4fb159e669f6b2a5"
};

// Inicialización (v8 / Compat)
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// Exportación de servicios
export const auth = app.auth();
export const db = app.firestore();
export default app;