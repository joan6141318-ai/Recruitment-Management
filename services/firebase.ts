import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// ------------------------------------------------------------------
// CONFIGURACIÓN DE FIREBASE
// Credenciales proporcionadas para el proyecto "gestor-reclutamiento"
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

// Inicialización de la aplicación (Compat)
const app = firebase.initializeApp(firebaseConfig);

// Exportación de servicios
export const auth = app.auth();
export const db = app.firestore();