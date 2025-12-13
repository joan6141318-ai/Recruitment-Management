import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc 
} from 'firebase/firestore';
import { User, Role } from '../types';

export const authService = {
  // Login
  login: async (email: string, password?: string): Promise<User> => {
    if (!password) throw new Error("Contraseña requerida");
    
    try {
      // 1. Autenticar con Firebase Auth Modular
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      if (!fbUser) throw new Error("Error en autenticación");

      // 2. Obtener datos del perfil de Firestore
      return await authService.getUserProfile(fbUser.uid, fbUser.email || email);
    } catch (error: any) {
      console.error("[Auth Error]", error.code, error.message);
      throw error;
    }
  },

  // Registro
  register: async (email: string, password?: string, nombre?: string): Promise<User> => {
    if (!password) throw new Error("Contraseña requerida");
    
    try {
      // 1. Crear usuario en Firebase Auth Modular
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      if (!fbUser) throw new Error("Error en creación de usuario");

      // 2. Actualizar Display Name
      if (nombre) {
        await updateProfile(fbUser, { displayName: nombre });
      }

      // 3. Crear perfil en Firestore
      return await authService.createUserProfile(fbUser.uid, email, nombre || email.split('@')[0]);
    } catch (error: any) {
      console.error("[Register Error]", error.code, error.message);
      throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  // Obtener Perfil
  getUserProfile: async (uid: string, email: string): Promise<User> => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        return { id: uid, ...data } as User;
      } else {
        // Recuperación automática: si el usuario está en Auth pero no en DB
        return await authService.createUserProfile(uid, email, email.split('@')[0]);
      }
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
      throw error;
    }
  },

  // Crear Perfil en Firestore
  createUserProfile: async (uid: string, email: string, nombre: string): Promise<User> => {
    const normalizedEmail = email.toLowerCase();
    
    // Por defecto todos son reclutadores. 
    const role: Role = 'reclutador'; 

    const userData = {
      nombre,
      correo: normalizedEmail,
      rol: role,
      fecha_registro: new Date().toISOString()
    };

    // Verificar si existía una invitación previa
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('correo', '==', normalizedEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Si había invitación, la borramos
        const existingDoc = querySnapshot.docs[0];
        await deleteDoc(existingDoc.ref); 
      }

      // Guardar el documento definitivo
      await setDoc(doc(db, 'users', uid), userData);

      return { id: uid, ...userData } as User;
    } catch (error: any) {
      console.error("Error creating profile:", error);
      if (error.code === 'permission-denied') {
        throw new Error('Error de permisos: Contacta al administrador.');
      }
      throw error;
    }
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
    return { id: docRef.id, ...newUserPayload } as User;
  }
};