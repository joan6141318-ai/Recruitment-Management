import { User, Emisor, HistorialHoras, Role, SystemMetadata } from '../types';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
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
export const auth = getAuth(app); // Exportamos auth para uso en App.tsx
export const db = getFirestore(app);

// --- CONFIGURACIÓN DE ACCESO ---
const ADMIN_EMAILS = [
  'joan6141318@gmail.com',
  'elianaloor86@gmail.com'
];

export const authService = {
  // Login usando Firebase Auth Real
  login: async (email: string, password?: string): Promise<User> => {
    try {
      if (!password) throw new Error("Contraseña requerida");
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      // Obtener datos adicionales del perfil en Firestore
      const userProfile = await authService.getUserProfile(fbUser.uid, fbUser.email || email);
      return userProfile;
    } catch (error: any) {
      console.error("[Auth Error]", error);
      throw error;
    }
  },

  // Registro usando Firebase Auth Real
  register: async (email: string, password?: string, nombre?: string): Promise<User> => {
    try {
      if (!password) throw new Error("Contraseña requerida");
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Crear o actualizar perfil en Firestore
      const userProfile = await authService.createUserProfile(fbUser.uid, email, nombre || email.split('@')[0]);
      return userProfile;
    } catch (error: any) {
      console.error("[Register Error]", error);
      throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  // Obtiene el perfil de Firestore. Si no existe, verifica si es Admin por email.
  getUserProfile: async (uid: string, email: string): Promise<User> => {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      // Force admin role if in whitelist
      if (ADMIN_EMAILS.includes(email.toLowerCase()) && data.rol !== 'admin') {
         await updateDoc(userDocRef, { rol: 'admin' });
         data.rol = 'admin';
      }
      return { id: uid, ...data } as User;
    } else {
      // Si el usuario existe en Auth pero no en Firestore (raro, pero posible)
      // O si es la primera vez que un Admin entra
      return await authService.createUserProfile(uid, email, email.split('@')[0]);
    }
  },

  createUserProfile: async (uid: string, email: string, nombre: string): Promise<User> => {
    const normalizedEmail = email.toLowerCase();
    
    // Verificar si ya existe un documento con este correo (creado por un Admin previamente)
    // para enlazar el UID de Auth con el documento existente.
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('correo', '==', normalizedEmail));
    const querySnapshot = await getDocs(q);

    let role: Role = 'reclutador';
    if (ADMIN_EMAILS.includes(normalizedEmail)) {
      role = 'admin';
    }

    if (!querySnapshot.empty) {
      // El admin ya había creado una invitación/perfil. Actualizamos el ID del documento
      // Nota: Firestore no permite cambiar ID de documento fácilmente, así que copiamos y borramos
      // o simplemente actualizamos los datos si usamos el correo como clave lógica.
      // Para simplificar, si ya existe por correo, usamos ese documento pero NO cambiamos su ID a UID Auth
      // Esto significa que Auth UID y Firestore ID pueden diferir. Mantenemos el Auth UID.
      
      const existingDoc = querySnapshot.docs[0];
      // Actualizamos datos faltantes
      await updateDoc(doc(db, 'users', existingDoc.id), { 
        auth_uid: uid, // Enlazamos
        last_login: new Date().toISOString()
      });
      
      return {
        id: existingDoc.id,
        nombre: existingDoc.data().nombre,
        correo: normalizedEmail,
        rol: existingDoc.data().rol as Role
      };
    }

    // Nuevo usuario total
    const newUser: Omit<User, 'id'> = {
      nombre,
      correo: normalizedEmail,
      rol: role
    };

    // Usamos el UID de Auth como ID del documento para consistencia futura
    await setDoc(doc(db, 'users', uid), {
      ...newUser,
      fecha_registro: new Date().toISOString()
    });

    return { id: uid, ...newUser };
  },
  
  // Función para que el ADMIN cree un "hueco" de reclutador. 
  // No crea usuario en Auth, solo en DB. El usuario debe registrarse después.
  createRecruiterInvite: async (nombre: string, correo: string): Promise<User> => {
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
      rol: 'reclutador' as Role,
      fecha_registro: new Date().toISOString(),
      invited_by_admin: true
    };
    
    const docRef = await addDoc(usersRef, newUserPayload);
    return { id: docRef.id, ...newUserPayload };
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
      // Buscar por ID de documento (si coincide con UID) o por campo auth_uid o reclutador_id
      // Asumimos que reclutador_id guarda el ID de Firestore del usuario
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