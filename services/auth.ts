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
      // 1. Autenticar con Firebase Auth (Compat)
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const fbUser = userCredential.user;
      
      if (!fbUser) throw new Error("Error al iniciar sesión");

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
      // 1. Crear usuario en Firebase Auth (Compat)
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const fbUser = userCredential.user;

      if (!fbUser) throw new Error("Error al registrar usuario");

      // 2. Actualizar Display Name en Auth (Compat instance method)
      if (nombre) {
        await fbUser.updateProfile({ displayName: nombre });
      }

      // 3. Crear perfil en Firestore
      return await authService.createUserProfile(fbUser.uid, email, nombre || email.split('@')[0]);
    } catch (error: any) {
      console.error("[Register Error]", error.code, error.message);
      throw error;
    }
  },

  logout: async () => {
    await auth.signOut();
  },

  // Obtener Perfil
  getUserProfile: async (uid: string, email: string): Promise<User> => {
    try {
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
    
    // Configuración inicial del usuario
    let role: Role = 'reclutador';
    if (ADMIN_EMAILS.includes(normalizedEmail)) {
      role = 'admin';
    }

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
        // Si había invitación, la borramos y usamos sus datos si es necesario
        const existingDoc = querySnapshot.docs[0];
        await deleteDoc(doc(db, 'users', existingDoc.id));
      }

      // Guardar el documento definitivo en la colección 'users' con el ID del usuario
      await setDoc(doc(db, 'users', uid), userData);

      return { id: uid, ...userData } as User;
    } catch (error: any) {
      // Manejo específico para permisos de Firestore
      if (error.code === 'permission-denied') {
        throw new Error('Error de permisos: Revisa las Reglas de Firestore en la consola.');
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