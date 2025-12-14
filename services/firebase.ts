import * as firebaseApp from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// Inicialización (Firebase v9+ Modular)
const app = firebaseApp.initializeApp(firebaseConfig);

// Exportación de instancias modulares
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;