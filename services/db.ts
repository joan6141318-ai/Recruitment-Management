import { User, Emisor, HistorialHoras, Role, SystemMetadata } from '../types';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where,
  getDoc,
  Timestamp
} from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAQKOMqF1JZGTfPQwH3GjAt0hhQOKrk1DY",
  authDomain: "gestor-reclutamiento.firebaseapp.com",
  projectId: "gestor-reclutamiento",
  storageBucket: "gestor-reclutamiento.firebasestorage.app",
  messagingSenderId: "177005324608",
  appId: "1:177005324608:web:7d871a4fb159e669f6b2a5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Diagnóstico de conexión (Solo visible en consola para desarrolladores)
console.log(`[Firebase] Inicializado proyecto: ${firebaseConfig.projectId}`);

// --- CONFIGURACIÓN DE ACCESO ---
// LISTA DE ADMINISTRADORES AUTORIZADOS
const ADMIN_EMAILS = [
  'joan6141318@gmail.com',
  'elianaloor86@gmail.com'
];

// --- SERVICES ---

// 1. Auth Service (Firestore Based)
export const authService = {
  login: async (email: string, password?: string): Promise<User | null> => {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Validación básica de que existe un intento de contraseña
    if (!password || password.length < 4) return null;

    // Determinar si este correo DEBERÍA ser admin (Estricto: Solo los de la lista)
    const shouldBeAdmin = ADMIN_EMAILS.includes(normalizedEmail);

    // 1. Check if user exists in Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('correo', '==', normalizedEmail));
    
    try {
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // --- USUARIO EXISTENTE ---
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as User;
        const userId = userDoc.id;

        // Auto-corregir rol si está en la lista blanca pero en BD es reclutador
        if (shouldBeAdmin && userData.rol !== 'admin') {
           await updateDoc(doc(db, 'users', userId), { rol: 'admin' });
           userData.rol = 'admin';
        }

        return { ...userData, id: userId };

      } else {
        // --- USUARIO NUEVO (REGISTRO AUTOMÁTICO) ---
        
        const newRole: Role = shouldBeAdmin ? 'admin' : 'reclutador';

        const newUser: User = {
          id: '', // Set by Firestore
          nombre: normalizedEmail.split('@')[0], // Default name from email
          correo: normalizedEmail,
          rol: newRole
        };
        
        const docRef = await addDoc(usersRef, newUser);
        return { ...newUser, id: docRef.id };
      }
    } catch (error) {
      console.error("Error crítico de conexión con Firebase:", error);
      throw error; // Propagate error to UI
    }
  },
  
  // Register a user explicitly (Admin panel)
  registerUser: async (nombre: string, correo: string, rol: Role): Promise<User> => {
    const normalizedEmail = correo.trim().toLowerCase();
    
    // Check if exists first to avoid duplicates
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('correo', '==', normalizedEmail));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
        throw new Error("El usuario ya existe");
    }

    const newUser: User = {
      id: '',
      nombre,
      correo: normalizedEmail,
      rol
    };
    
    const docRef = await addDoc(usersRef, newUser);
    return { ...newUser, id: docRef.id };
  }
};

// 2. Data Service
export const dataService = {
  // Get Metadata
  getMetadata: async (): Promise<SystemMetadata> => {
    try {
      const docRef = doc(db, 'system', 'metadata');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as SystemMetadata;
      } else {
        // Initialize if doesn't exist
        const initialData = { lastUpdated: new Date().toISOString().split('T')[0] };
        await setDoc(docRef, initialData);
        return initialData;
      }
    } catch (e) {
      console.error("Error fetching metadata", e);
      return { lastUpdated: new Date().toISOString().split('T')[0] };
    }
  },

  // Update Metadata (Admin)
  updateMetadata: async (newDate: string): Promise<void> => {
    const docRef = doc(db, 'system', 'metadata');
    await setDoc(docRef, { lastUpdated: newDate }, { merge: true });
  },

  // Get Users (Recruiters)
  getRecruiters: async (): Promise<User[]> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('rol', '==', 'reclutador'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  },

  // Get Emisores (filtered by role logic)
  getEmisores: async (currentUser: User): Promise<Emisor[]> => {
    const emisoresRef = collection(db, 'emisores');
    let q;

    if (currentUser.rol === 'admin') {
      q = query(emisoresRef);
    } else {
      q = query(emisoresRef, where('reclutador_id', '==', currentUser.id));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Emisor));
  },

  // Add Emisor
  addEmisor: async (emisorData: Omit<Emisor, 'id' | 'fecha_registro' | 'horas_mes' | 'estado'>, currentUser: User): Promise<Emisor> => {
    const newEmisor = {
      ...emisorData,
      horas_mes: 0,
      estado: 'activo',
      fecha_registro: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, 'emisores'), newEmisor);
    return { ...newEmisor, id: docRef.id } as Emisor;
  },

  // Update Hours (Admin Only)
  updateHours: async (emisorId: string, newHours: number, adminId: string): Promise<void> => {
    const emisorRef = doc(db, 'emisores', emisorId);
    
    // Get current hours for history
    const emisorSnap = await getDoc(emisorRef);
    let oldHours = 0;
    if (emisorSnap.exists()) {
        oldHours = emisorSnap.data().horas_mes || 0;
    }

    // Update
    await updateDoc(emisorRef, { horas_mes: newHours });

    // Log history
    await addDoc(collection(db, 'historial'), {
        emisor_id: emisorId,
        horas_anteriores: oldHours,
        horas_nuevas: newHours,
        fecha: new Date().toISOString(),
        modificado_por: adminId
    });
  },

  // Toggle Status (Admin Only)
  toggleStatus: async (emisorId: string): Promise<void> => {
    const emisorRef = doc(db, 'emisores', emisorId);
    const emisorSnap = await getDoc(emisorRef);
    
    if (emisorSnap.exists()) {
      const currentStatus = emisorSnap.data().estado;
      const newStatus = currentStatus === 'activo' ? 'pausado' : 'activo';
      await updateDoc(emisorRef, { estado: newStatus });
    }
  },

  // Get History
  getHistory: async (emisorId?: string): Promise<HistorialHoras[]> => {
    const historyRef = collection(db, 'historial');
    let q;
    
    if (emisorId) {
        q = query(historyRef, where('emisor_id', '==', emisorId));
    } else {
        q = query(historyRef);
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as HistorialHoras));
  }
};