
import { User, Emisor, HistorialHoras, SystemMetadata, InvoiceConfig } from '../types';
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

  getInvoiceConfig: async (): Promise<InvoiceConfig> => {
    try {
      const docRef = doc(db, 'system', 'invoice_config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return docSnap.data() as InvoiceConfig;
      
      const defaultConfig: InvoiceConfig = {
        agenciaNombre: "AGENCIA MOON",
        agenciaInfo: "Información de identidad independiente y socio operativo de Bigo Live",
        conceptoSector: "pago de servicios",
        brackets: [
          { seeds: 3000000, usd: 500 },
          { seeds: 2000000, usd: 400 },
          { seeds: 1000000, usd: 300 },
          { seeds: 500000, usd: 200 },
          { seeds: 10000, usd: 7 },
          { seeds: 2000, usd: 1.5 }
        ],
        institucionPago: "Paypal"
      };
      await setDoc(docRef, defaultConfig);
      return defaultConfig;
    } catch (e) {
      return {} as InvoiceConfig;
    }
  },

  subscribeToInvoiceConfig: (callback: (config: InvoiceConfig) => void): () => void => {
    const docRef = doc(db, 'system', 'invoice_config');
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as InvoiceConfig);
      }
    });
  },

  updateInvoiceConfig: async (config: InvoiceConfig): Promise<void> => {
    const docRef = doc(db, 'system', 'invoice_config');
    await setDoc(docRef, config);
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

  // Suscripción al perfil de un usuario específico
  subscribeToUserProfile: (uid: string, callback: (user: User | null) => void): () => void => {
    const docRef = doc(db, 'users', uid);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as User);
      } else {
        callback(null);
      }
    });
  },

  // Suscripción a todos los reclutadores
  subscribeToRecruiters: (callback: (users: User[]) => void): () => void => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('rol', '==', 'reclutador'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        activo: docSnap.data().activo !== undefined ? docSnap.data().activo : true 
      } as User));
      callback(users);
    });
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

  addEmisor: async (emisorData: any, currentUser: User): Promise<Emisor> => {
    const newEmisor = {
      ...emisorData,
      horas_mes: emisorData.horas_mes !== undefined ? Number(emisorData.horas_mes) : 0,
      semillas_mes: emisorData.semillas_mes !== undefined ? Number(emisorData.semillas_mes) : 0,
      estado: 'activo',
      fecha_registro: new Date().toISOString(),
      es_compartido: emisorData.es_compartido || false,
      isManualEntry: emisorData.isManualEntry || false
    };
    
    const docRef = await addDoc(collection(db, 'emisores'), newEmisor);
    return { ...newEmisor, id: docRef.id } as Emisor;
  },

  updateEmisorData: async (emisorId: string, data: Partial<Emisor>, adminId: string): Promise<void> => {
    const batch = writeBatch(db);
    const emisorRef = doc(db, 'emisores', emisorId);
    
    if (data.horas_mes !== undefined) {
        const emisorSnap = await getDoc(emisorRef);
        let oldHours = 0;
        if (emisorSnap.exists()) {
            const currentData = emisorSnap.data();
            oldHours = currentData ? currentData.horas_mes : 0;
        }

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
