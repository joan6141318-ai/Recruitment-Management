import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// IMPORTANTE: REEMPLAZA ESTAS CREDENCIALES CON LAS DE TU PROYECTO
// ------------------------------------------------------------------
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un proyecto nuevo (ej: "agencia-moon-app")
// 3. Registra una app web.
// 4. Copia el objeto `firebaseConfig` y pégalo abajo.
// 5. Ve a Authentication > Sign-in method > Habilita "Email/Password".
// 6. Ve a Firestore Database > Crear base de datos > Modo Producción.
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI", // <--- Pega tu API Key real
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROYECTO.firebasestorage.app",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicialización controlada
let app;
try {
  // Comprobamos si las keys son las default para avisar en consola
  if (firebaseConfig.apiKey === "TU_API_KEY_AQUI") {
    console.error("⛔ ERROR FATAL: No has configurado las credenciales de Firebase en services/firebase.ts");
  }
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase inicializado correctamente");
} catch (error) {
  console.error("❌ Error inicializando Firebase:", error);
  throw error;
}

// Exportación de servicios
export const auth = getAuth(app);
export const db = getFirestore(app);