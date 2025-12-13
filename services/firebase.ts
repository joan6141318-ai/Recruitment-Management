import * as firebaseApp from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración directa y limpia.
// Se han eliminado los bloques try/catch complejos que ocultaban errores de configuración.
const firebaseConfig = {
  apiKey: "AIzaSyAQKOMqF1JZGTfPQwH3GjAt0hhQOKrk1DY",
  authDomain: "gestor-reclutamiento.firebaseapp.com",
  projectId: "gestor-reclutamiento",
  storageBucket: "gestor-reclutamiento.firebasestorage.app",
  messagingSenderId: "177005324608",
  appId: "1:177005324608:web:7d871a4fb159e669f6b2a5"
};

// Inicialización estándar y robusta
// Using namespace import to avoid "no exported member" errors in some TS environments
const app = firebaseApp.initializeApp(firebaseConfig);

// Exportación de servicios singleton
export const auth = firebaseAuth.getAuth(app);
export const db = getFirestore(app);