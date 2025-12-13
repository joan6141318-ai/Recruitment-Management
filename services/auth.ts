import * as firebaseAuth from 'firebase/auth';
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
  // Login usando Firebase Auth
  login: async (email: string, password?: string): Promise<User> => {
    try {
      if (!password) throw new Error("Contraseña requerida");
      
      const userCredential = await firebaseAuth.signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      // Obtener perfil de Firestore
      const userProfile = await authService.getUserProfile(fbUser.uid, fbUser.email || email);
      return userProfile;
    } catch (error: any) {
      console.error("[Auth Error]", error);
      throw error;
    }
  },

  // Registro de usuarios
  register: async (email: string, password?: string, nombre?: string): Promise<User> => {
    try {
      if (!password) throw new Error("Contraseña requerida");
      
      const userCredential = await firebaseAuth.createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Crear o vincular perfil en Firestore
      const userProfile = await authService.createUserProfile(fbUser.uid, email, nombre || email.split('@')[0]);
      return userProfile;
    } catch (error: any) {
      console.error("[Register Error]", error);
      throw error;
    }
  },

  logout: async () => {
    await firebaseAuth.signOut(auth);
  },

  // Obtiene el perfil. Si no existe en Firestore pero sí en Auth, lo crea.
  getUserProfile: async (uid: string, email: string): Promise<User> => {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      // Forzar rol de admin si está en la lista blanca y no lo tiene
      if (ADMIN_EMAILS.includes(email.toLowerCase()) && data.rol !== 'admin') {
         await updateDoc(userDocRef, { rol: 'admin' });
         data.rol = 'admin';
      }
      return { id: uid, ...data } as User;
    } else {
      // Recuperación automática de perfil
      return await authService.createUserProfile(uid, email, email.split('@')[0]);
    }
  },

  // Lógica crítica de creación de perfil
  createUserProfile: async (uid: string, email: string, nombre: string): Promise<User> => {
    const normalizedEmail = email.toLowerCase();
    
    // 1. Verificar si existe una invitación (documento creado por Admin previamente)
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

    // Si existe una invitación pendiente (creada por Admin con ID aleatorio)
    if (!querySnapshot.empty) {
      const existingDoc = querySnapshot.docs[0];
      const existingData = existingDoc.data();
      
      // Preservar datos de la invitación
      finalUserData = { ...finalUserData, ...existingData, rol: role === 'admin' ? 'admin' : existingData.rol };
      
      // MIGRACIÓN DE DATOS: Borramos el doc viejo (ID aleatorio) y creamos uno nuevo con el UID de Auth
      // Esto asegura que Auth UID == Firestore ID siempre.
      await deleteDoc(doc(db, 'users', existingDoc.id));
    }

    // Crear el documento definitivo con el UID de autenticación
    await setDoc(doc(db, 'users', uid), finalUserData);

    return { id: uid, ...finalUserData };
  },
  
  // Función para que el Admin invite reclutadores (Crea placeholder en BD)
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
    
    // Se crea con ID automático. Cuando el usuario se registre realmente, este doc se migrará.
    const docRef = await addDoc(usersRef, newUserPayload); // addDoc usa la instancia importada de firebase.ts indirectamente? No, necesita import
    return { id: docRef.id, ...newUserPayload };
  }
};