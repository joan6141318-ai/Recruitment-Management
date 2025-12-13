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
  getDoc
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

// Inicialización Singleton
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- CONFIGURACIÓN DE ACCESO ---
const ADMIN_EMAILS = [
  'joan6141318@gmail.com',
  'elianaloor86@gmail.com'
];

export const authService = {
  // Login soporta un modo 'revalidate_session' para comprobaciones automáticas de seguridad
  login: async (email: string, password?: string): Promise<User | null> => {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        
        // Validación de password solo si no es una revalidación de sesión
        if (password !== 'revalidate_session') {
           if (!password || password.length < 4) return null;
        }

        const shouldBeAdmin = ADMIN_EMAILS.includes(normalizedEmail);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('correo', '==', normalizedEmail));
        
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Usuario existe
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data() as User;
            const userId = userDoc.id;

            // Integridad: Forzar rol de admin si está en la lista blanca
            if (shouldBeAdmin && userData.rol !== 'admin') {
                await updateDoc(doc(db, 'users', userId), { rol: 'admin' });
                userData.rol = 'admin';
            }

            return { ...userData, id: userId };
        } else {
            // Si es revalidación de sesión y no existe, devolver null (bloquear acceso)
            if (password === 'revalidate_session') return null;

            // Auto-registro controlado para nuevos usuarios
            const newRole: Role = shouldBeAdmin ? 'admin' : 'reclutador';
            const newUser: User = {
                id: '',
                nombre: normalizedEmail.split('@')[0],
                correo: normalizedEmail,
                rol: newRole
            };
            
            const docRef = await addDoc(usersRef, newUser);
            return { ...newUser, id: docRef.id };
        }
    } catch (error) {
      console.error("[Auth Error]", error);
      // Propagar error para que la UI sepa que hubo fallo de red
      throw new Error("Error de conexión"); 
    }
  },
  
  registerUser: async (nombre: string, correo: string, rol: Role): Promise<User> => {
    try {
        const normalizedEmail = correo.trim().toLowerCase();
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
    } catch (error) {
        console.error("[Register Error]", error);
        throw error;
    }
  }
};

export const dataService = {
  getMetadata: async (): Promise<SystemMetadata> => {
    try {
      const docRef = doc(db, 'system', 'metadata');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as SystemMetadata;
      } else {
        const initialData = { lastUpdated: new Date().toISOString().split('T')[0] };
        await setDoc(docRef, initialData);
        return initialData;
      }
    } catch (e) {
      // Fallback offline seguro
      return { lastUpdated: new Date().toISOString().split('T')[0] };
    }
  },

  updateMetadata: async (newDate: string): Promise<void> => {
    const docRef = doc(db, 'system', 'metadata');
    await setDoc(docRef, { lastUpdated: newDate }, { merge: true });
  },

  getRecruiters: async (): Promise<User[]> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('rol', '==', 'reclutador'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  },

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

  toggleStatus: async (emisorId: string): Promise<void> => {
    const emisorRef = doc(db, 'emisores', emisorId);
    const emisorSnap = await getDoc(emisorRef);
    
    if (emisorSnap.exists()) {
      const currentStatus = emisorSnap.data().estado;
      const newStatus = currentStatus === 'activo' ? 'pausado' : 'activo';
      await updateDoc(emisorRef, { estado: newStatus });
    }
  },

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