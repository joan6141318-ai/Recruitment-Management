
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
  writeBatch 
} from 'firebase/firestore';

export const dataService = {
  // --- SYSTEM ---
  getMetadata: async (): Promise<SystemMetadata> => {
    try {
      const docRef = doc(db, 'system', 'metadata');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return docSnap.data() as SystemMetadata;
      
      const initial = { lastUpdated: new Date().toISOString().split('T')[0] };
      await setDoc(docRef, initial);
      return initial;
    } catch (e) {
      return { lastUpdated: new Date().toISOString().split('T')[0] };
    }
  },

  updateMetadata: async (newDate: string): Promise<void> => {
    const docRef = doc(db, 'system', 'metadata');
    await setDoc(docRef, { lastUpdated: newDate }, { merge: true });
  },

  // --- USERS ---
  updateUserName: async (userId: string, newName: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { nombre: newName });
  },

  toggleUserAccess: async (userId: string, currentRole: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    // Si está baneado, lo reactivamos como reclutador. Si no, lo baneamos.
    const newRole = currentRole === 'banned' ? 'reclutador' : 'banned';
    await updateDoc(userRef, { rol: newRole });
  },

  getRecruiters: async (): Promise<User[]> => {
    const usersRef = collection(db, 'users');
    // Traemos reclutadores y baneados para poder gestionarlos
    const q = query(usersRef, where('rol', 'in', ['reclutador', 'banned']));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as User));
  },

  // --- EMISORES ---
  getEmisores: async (currentUser: User): Promise<Emisor[]> => {
    const emisoresRef = collection(db, 'emisores');
    let q;

    if (currentUser.rol === 'admin') {
      q = query(emisoresRef);
    } else {
      q = query(emisoresRef, where('reclutador_id', '==', currentUser.id));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
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
    const batch = writeBatch(db);
    const emisorRef = doc(db, 'emisores', emisorId);
    const historialRef = doc(collection(db, 'historial'));
    
    const emisorSnap = await getDoc(emisorRef);
    let oldHours = 0;
    if (emisorSnap.exists()) {
        const data = emisorSnap.data();
        oldHours = data ? data.horas_mes : 0;
    }

    batch.update(emisorRef, { horas_mes: newHours });
    batch.set(historialRef, {
        emisor_id: emisorId,
        horas_anteriores: oldHours,
        horas_nuevas: newHours,
        fecha: new Date().toISOString(),
        modificado_por: adminId
    });

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
  }
};
