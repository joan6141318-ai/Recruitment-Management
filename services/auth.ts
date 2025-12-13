import { auth, db } from './firebase';
import { User, Role } from '../types';

export const authService = {
  // Login
  login: async (email: string, password?: string): Promise<User> => {
    if (!password) throw new Error("Contraseña requerida");
    
    try {
      // 1. Autenticar con Firebase Auth (v8)
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
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
      // 1. Crear usuario en Firebase Auth (v8)
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const fbUser = userCredential.user;

      if (!fbUser) throw new Error("Error en creación de usuario");

      // 2. Actualizar Display Name en Auth
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
      const userDocRef = db.collection('users').doc(uid);
      const userDocSnap = await userDocRef.get();

      if (userDocSnap.exists) {
        const data = userDocSnap.data() as any;
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
    // Para hacer a alguien ADMIN, debes editar el campo 'rol' a 'admin' manualmente 
    // en la consola de Firebase la primera vez.
    const role: Role = 'reclutador'; 

    const userData = {
      nombre,
      correo: normalizedEmail,
      rol: role,
      fecha_registro: new Date().toISOString()
    };

    // Verificar si existía una invitación previa
    try {
      const usersRef = db.collection('users');
      const q = usersRef.where('correo', '==', normalizedEmail);
      const querySnapshot = await q.get();

      if (!querySnapshot.empty) {
        // Si había invitación, la borramos y usamos sus datos si es necesario
        const existingDoc = querySnapshot.docs[0];
        // Nota: Si las reglas impiden borrar al usuario nuevo, esto podría fallar,
        // pero en el flujo normal, la invitación sirve para reservar el correo.
        await existingDoc.ref.delete(); 
      }

      // Guardar el documento definitivo en la colección 'users' con el ID del usuario
      await db.collection('users').doc(uid).set(userData);

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
    const usersRef = db.collection('users');
    const q = usersRef.where('correo', '==', normalizedEmail);
    const snap = await q.get();
    
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
    
    const docRef = await usersRef.add(newUserPayload);
    return { id: docRef.id, ...newUserPayload } as User;
  }
};