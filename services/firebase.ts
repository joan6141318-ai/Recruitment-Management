import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

// ------------------------------------------------------------------
// CONFIGURACIÓN DE FIREBASE
// ------------------------------------------------------------------
const firebaseConfig = {
  // Reemplaza esto con tus credenciales reales de Firebase Console -> Project Settings
  apiKey: "TU_API_KEY_AQUI", 
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROYECTO.firebasestorage.app",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicialización segura (Singleton pattern para v8)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Exportación de servicios (v8/Compat instances)
export const auth = firebase.auth();
export const db = firebase.firestore();

// Export firebase default for usage in other files if needed
export default firebase;