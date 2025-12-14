import { User, Emisor, HistorialHoras, SystemMetadata } from '../types';
import { db } from './firebase'; 
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';

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

  updateUserName: async (userId: string, newName: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { nombre: newName });
  },

  toggleUserAccess: async (userId: string, currentStatus: boolean): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { activo: !currentStatus });
  },

  getRecruiters: async (): Promise<User[]> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('rol', '==', 'reclutador'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            activo: data.activo !== undefined ? data.activo : true // Default to true if missing
        } as User;
    });
  },

  // MODIFICADO: Acepta un targetRecruiterId opcional para filtros de Admin
  getEmisores: async (currentUser: User, targetRecruiterId?: string): Promise<Emisor[]> => {
    const emisoresRef = collection(db, 'emisores');
    let q;

    if (currentUser.rol === 'admin') {
      // Si es Admin y pide un reclutador específico, filtramos
      if (targetRecruiterId) {
        q = query(emisoresRef, where('reclutador_id', '==', targetRecruiterId));
      } else {
        // Si no, trae todo
        q = query(emisoresRef);
      }
    } else {
      // Si es Reclutador, SIEMPRE solo los suyos, ignorando el target
      q = query(emisoresRef, where('reclutador_id', '==', currentUser.id));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as Emisor));
  },

  // NUEVO: Suscripción en tiempo real para el Dashboard
  subscribeToEmisores: (currentUser: User, callback: (emisores: Emisor[]) => void): () => void => {
    const emisoresRef = collection(db, 'emisores');
    let q;

    if (currentUser.rol === 'admin') {
      q = query(emisoresRef);
    } else {
      q = query(emisoresRef, where('reclutador_id', '==', currentUser.id));
    }

    // onSnapshot devuelve la función para desuscribirse
    return onSnapshot(q, (snapshot) => {
      const emisores = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Emisor));
      callback(emisores);
    });
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
    const batch = writeBatch(db);
    
    // Referencias
    const emisorRef = doc(db, 'emisores', emisorId);
    const historialRef = doc(collection(db, 'historial')); // ID automático para historial
    
    // Obtener datos actuales para el historial (lectura antes de escritura)
    const emisorSnap = await getDoc(emisorRef);
    let oldHours = 0;
    if (emisorSnap.exists()) {
        const data = emisorSnap.data();
        oldHours = data ? data.horas_mes : 0;
    }

    // 1. Actualizar Horas
    batch.update(emisorRef, { horas_mes: newHours });

    // 2. Crear registro Historial
    batch.set(historialRef, {
        emisor_id: emisorId,
        horas_anteriores: oldHours,
        horas_nuevas: newHours,
        fecha: new Date().toISOString(),
        modificado_por: adminId
    });

    // Ejecutar ambas operaciones atómicamente
    await batch.commit();
  },

  toggleStatus: async (emisorId: string): Promise<void> => {
    const emisorRef = doc(db, 'emisores', emisorId);
    const emisorSnap = await getDoc(emisorRef);
    
    if (emisorSnap.exists()) {
      const data = emisorSnap.data();
      const currentStatus = data ? data.estado : 'activo';
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
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as HistorialHoras));
  }
};