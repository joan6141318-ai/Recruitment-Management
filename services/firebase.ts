import * as firebaseApp from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. Configuración de respaldo (Hardcoded) 
// Vital para asegurar que la app cargue incluso si fallan las variables de entorno o import.meta
const DEFAULT_CONFIG = {
  apiKey: "AIzaSyAQKOMqF1JZGTfPQwH3GjAt0hhQOKrk1DY",
  authDomain: "gestor-reclutamiento.firebaseapp.com",
  projectId: "gestor-reclutamiento",
  storageBucket: "gestor-reclutamiento.firebasestorage.app",
  messagingSenderId: "177005324608",
  appId: "1:177005324608:web:7d871a4fb159e669f6b2a5"
};

const getFirebaseConfig = () => {
  try {
    // 2. Verificación de seguridad para import.meta
    // Evita el error "Cannot read properties of undefined" verificando cada nivel
    const meta = import.meta as any;
    if (typeof meta !== 'undefined' && meta.env) {
      return {
        apiKey: meta.env.VITE_FIREBASE_API_KEY || DEFAULT_CONFIG.apiKey,
        authDomain: meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_CONFIG.authDomain,
        projectId: meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_CONFIG.projectId,
        storageBucket: meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_CONFIG.storageBucket,
        messagingSenderId: meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_CONFIG.messagingSenderId,
        appId: meta.env.VITE_FIREBASE_APP_ID || DEFAULT_CONFIG.appId
      };
    }
  } catch (error) {
    // Si algo falla al leer el entorno, fallamos silenciosamente al default
    console.warn('Usando configuración por defecto de Firebase.');
  }

  return DEFAULT_CONFIG;
};

// Inicialización de la App con la configuración resuelta
const app = firebaseApp.initializeApp(getFirebaseConfig());

// Exportación de instancias
export const auth = firebaseAuth.getAuth(app);
export const db = getFirestore(app);