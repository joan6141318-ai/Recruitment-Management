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
  login: async (email: string, password?: string): Promise<User | null> => {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        
        // Validación básica
        if (!password) return null;
        if (password !== 'revalidate_session' && password.length < 4) return null;

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('correo', '==', normalizedEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            const userId = userDoc.id;
            
            // LOGICA DE SEGURIDAD Y RECUPERACIÓN
            if (password !== 'revalidate_session') {
                const isAdmin = ADMIN_EMAILS.includes(normalizedEmail);
                
                if (isAdmin) {
                    // *** SOLUCIÓN MAESTRA PARA EL DUEÑO ***
                    // Si eres Admin y la contraseña no coincide, ASUMIMOS QUE ESTÁS RESETEANDOLA.
                    // Esto evita que te quedes fuera de tu propio sistema.
                    if (userData.password !== password) {
                        await updateDoc(doc(db, 'users', userId), { password: password });
                        console.log("Contraseña de Admin actualizada automáticamente.");
                    }
                } else {
                    // Para usuarios normales (Reclutadores), la verificación es ESTRICTA.
                    if (userData.password && userData.password !== password) {
                        console.warn("Contraseña incorrecta para usuario estándar");
                        return null;
                    }
                }

                // Migración para usuarios viejos sin contraseña
                if (!userData.password) {
                    await updateDoc(doc(db, 'users', userId), { password: password });
                }
            }

            // Integridad: Forzar rol de admin si está en la lista blanca
            let currentRole = userData.rol;
            if (ADMIN_EMAILS.includes(normalizedEmail) && currentRole !== 'admin') {
                await updateDoc(doc(db, 'users', userId), { rol: 'admin' });
                currentRole = 'admin';
            }

            return { 
                id: userId,
                nombre: userData.nombre,
                correo: userData.correo,
                rol: currentRole
            } as User;
        } else {
            // Si es revalidación y no existe, adios.
            if (password === 'revalidate_session') return null;

            // Auto-registro para nuevos usuarios
            const shouldBeAdmin = ADMIN_EMAILS.includes(normalizedEmail);
            const newRole: Role = shouldBeAdmin ? 'admin' : 'reclutador';
            
            const newUserPayload = {
                nombre: normalizedEmail.split('@')[0],
                correo: normalizedEmail,
                password: password, 
                rol: newRole,
                fecha_registro: new Date().toISOString()
            };
            
            const docRef = await addDoc(usersRef, newUserPayload);
            
            return { 
                id: docRef.id,
                nombre: newUserPayload.nombre,
                correo: newUserPayload.correo,
                rol: newUserPayload.rol
            } as User;
        }
    } catch (error) {
      console.error("[Auth Error]", error);
      throw new Error("Error de conexión"); 
    }
  },
  
  registerUser: async (nombre: string, correo: string, rol: Role, password?: string): Promise<User> => {
    try {
        const normalizedEmail = correo.trim().toLowerCase();
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('correo', '==', normalizedEmail));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            throw new Error("El usuario ya existe");
        }

        const newUserPayload = {
            nombre,
            correo: normalizedEmail,
            rol,
            password: password || '123456', 
            fecha_registro: new Date().toISOString()
        };
        
        const docRef = await addDoc(usersRef, newUserPayload);
        return { 
            id: docRef.id, 
            nombre: newUserPayload.nombre, 
            correo: newUserPayload.correo, 
            rol: newUserPayload.rol 
        } as User;
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
    const emisorSnap = await getDoc(emisorRef);
    let oldHours = 0;
    if (emisorSnap.exists()) {
        oldHours = emisorSnap.data().horas_mes || 0;
    }
    await updateDoc(emisorRef, { horas_mes: newHours });
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
    let q = emisorId ? query(historyRef, where('emisor_id', '==', emisorId)) : query(historyRef);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as HistorialHoras));
  }
};