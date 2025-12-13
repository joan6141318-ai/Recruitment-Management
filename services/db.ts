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

// Helper for current month
const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

// Admin whitelist for auto-creation/login
const ADMIN_EMAILS = ['Joan6141318@gmail.com', 'elianaloor86@gmail.com'];

// --- SERVICES ---

// 1. Auth Service (Firestore Based)
export const authService = {
  login: async (email: string, password?: string): Promise<User | null> => {
    const normalizedEmail = email.trim().toLowerCase(); // Normalize email
    const cleanPassword = password?.trim();
    
    // 1. Check if user exists in Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('correo', '==', normalizedEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // User exists
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;
      
      // Admin: Access allowed immediately
      if (userData.rol === 'admin') {
        return { ...userData, id: userDoc.id };
      }
      
      // Recruiter: Must match Master Password
      if (userData.rol === 'reclutador') {
        if (cleanPassword === 'Moon2026') {
          return { ...userData, id: userDoc.id };
        } else {
          return null; // Wrong password
        }
      }
    } else {
      // User does NOT exist. Logic for Auto-Registration.

      // A. Is it a whitelisted Admin?
      // Since emails can be case sensitive in input, we checked normalized above. 
      // We check if the input matches our whitelist (case-insensitive check).
      const isAdminEmail = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail);
      
      if (isAdminEmail) {
        const newUser: User = {
          id: '', // Will be set by Firestore ID or ignored
          nombre: normalizedEmail.split('@')[0],
          correo: normalizedEmail,
          rol: 'admin'
        };
        // Create in DB
        const docRef = await addDoc(usersRef, newUser);
        return { ...newUser, id: docRef.id };
      }

      // B. Is it a Recruiter with Master Key?
      if (cleanPassword === 'Moon2026') {
         const newUser: User = {
           id: '',
           nombre: normalizedEmail.split('@')[0], // Default name
           correo: normalizedEmail,
           rol: 'reclutador'
         };
         const docRef = await addDoc(usersRef, newUser);
         return { ...newUser, id: docRef.id };
      }
    }

    return null;
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