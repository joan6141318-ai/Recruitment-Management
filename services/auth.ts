import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, Role } from '../types';

// Lista de correos que automáticamente obtienen rol de ADMIN
const ADMIN_EMAILS = [
  'joan6141318@gmail.com',
  'elianaloor86@gmail.com'
];

export const authService = {
  // Login
  login: async (email: string, password?: string): Promise<User> => {
    if (!password) throw new Error("Contraseña requerida");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      return await authService.getUserProfile(fbUser.uid, fbUser.email || email);
    } catch (error: any) {
      console.error("[Auth Error]", error);
      throw error;
    }
  },

  // Registro
  register: async (email: string, password?: string, nombre?: string): Promise<User> => {
    if (!password) throw new Error("Contraseña requerida");
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      return await authService.createUserProfile(fbUser.uid, email, nombre || email.split('@')[0]);
    } catch (error: any) {
      console.error("[Register Error]", error);
      throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  // Obtener Perfil
  getUserProfile: async (uid: string, email: string): Promise<User> => {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      // Verificación de seguridad de rol Admin
      if (ADMIN_EMAILS.includes(email.toLowerCase()) && data.rol !== 'admin') {
         await updateDoc(userDocRef, { rol: 'admin' });
         data.rol = 'admin';
      }
      return { id: uid, ...data } as User;
    } else {
      // Recuperación automática si el documento no existe pero el Auth sí
      return await authService.createUserProfile(uid, email, email.split('@')[0]);
    }
  },

  // Crear Perfil en Firestore
  createUserProfile: async (uid: string, email: string, nombre: string): Promise<User> => {
    const normalizedEmail = email.toLowerCase();
    
    // Verificar invitación previa
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('correo', '==', normalizedEmail));
    const querySnapshot = await getDocs(q);

    let role: Role = 'reclutador';
    if (ADMIN_EMAILS.includes(normalizedEmail)) {
      role = 'admin';
    }

    let finalUserData: any = {
      nombre,
      correo: normalizedEmail,
      rol: role,
      fecha_registro: new Date().toISOString()
    };

    // Procesar invitación si existe
    if (!querySnapshot.empty) {
      const existingDoc = querySnapshot.docs[0];
      const existingData = existingDoc.data();
      
      finalUserData = { ...finalUserData, ...existingData, rol: role === 'admin' ? 'admin' : existingData.rol };
      
      // Eliminar el documento temporal de invitación
      await deleteDoc(doc(db, 'users', existingDoc.id));
    }

    // Guardar documento definitivo con ID igual al UID de Auth
    await setDoc(doc(db, 'users', uid), finalUserData);

    return { id: uid, ...finalUserData };
  },
  
  // Crear invitación (Solo Admin)
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