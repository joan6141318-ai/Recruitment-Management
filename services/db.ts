import { User, Emisor, HistorialHoras, SystemMetadata } from '../types';
import { 
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
import { db } from './firebase'; // Importamos la instancia única

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
      // Filtramos por el ID del reclutador (que ahora siempre coincide con su UID de Auth)
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