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
  deleteDoc,
  query, 
  where,
  writeBatch,
  onSnapshot,
  or 
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
            activo: data.activo !== undefined ? data.activo : true 
        } as User;
    });
  },

  getEmisores: async (currentUser: User, targetRecruiterId?: string): Promise<Emisor[]> => {
    const emisoresRef = collection(db, 'emisores');
    let q;

    if (currentUser.rol === 'admin') {
      if (targetRecruiterId) {
        q = query(emisoresRef, where('reclutador_id', '==', targetRecruiterId));
      } else {
        q = query(emisoresRef);
      }
    } else {
      q = query(
        emisoresRef, 
        or(
          where('reclutador_id', '==', currentUser.id),
          where('es_compartido', '==', true)
        )
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as Emisor));
  },

  subscribeToEmisores: (currentUser: User, callback: (emisores: Emisor[]) => void): () => void => {
    const emisoresRef = collection(db, 'emisores');
    let q;

    if (currentUser.rol === 'admin') {
      q = query(emisoresRef);
    } else {
      q = query(
        emisoresRef, 
        or(
          where('reclutador_id', '==', currentUser.id),
          where('es_compartido', '==', true)
        )
      );
    }

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
      es_compartido: emisorData.es_compartido || false 
    };
    
    const docRef = await addDoc(collection(db, 'emisores'), newEmisor);
    return { ...newEmisor, id: docRef.id } as Emisor;
  },

  // FUNCIÓN ACTUALIZADA: Permite editar datos y horas al mismo tiempo
  updateEmisorData: async (emisorId: string, data: Partial<Emisor>, adminId: string): Promise<void> => {
    const batch = writeBatch(db);
    const emisorRef = doc(db, 'emisores', emisorId);
    
    // Si se están actualizando las horas, guardamos historial
    if (data.horas_mes !== undefined) {
        const emisorSnap = await getDoc(emisorRef);
        let oldHours = 0;
        if (emisorSnap.exists()) {
            const currentData = emisorSnap.data();
            oldHours = currentData ? currentData.horas_mes : 0;
        }

        // Solo crear historial si las horas realmente cambiaron
        if (oldHours !== data.horas_mes) {
            const historialRef = doc(collection(db, 'historial'));
            batch.set(historialRef, {
                emisor_id: emisorId,
                horas_anteriores: oldHours,
                horas_nuevas: data.horas_mes,
                fecha: new Date().toISOString(),
                modificado_por: adminId
            });
        }
    }

    batch.update(emisorRef, data);
    await batch.commit();
  },

  // MANTENIDA POR COMPATIBILIDAD (Redirige a la nueva)
  updateHours: async (emisorId: string, newHours: number, adminId: string): Promise<void> => {
      return dataService.updateEmisorData(emisorId, { horas_mes: newHours }, adminId);
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

  toggleShared: async (emisorId: string, currentStatus?: boolean): Promise<void> => {
    const emisorRef = doc(db, 'emisores', emisorId);
    await updateDoc(emisorRef, { es_compartido: !currentStatus });
  },

  deleteEmisor: async (emisorId: string): Promise<void> => {
    const emisorRef = doc(db, 'emisores', emisorId);
    await deleteDoc(emisorRef);
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