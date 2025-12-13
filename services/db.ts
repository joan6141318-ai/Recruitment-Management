import { User, Emisor, HistorialHoras, SystemMetadata } from '../types';
import { db } from './firebase'; // Importamos la instancia única (v8/Compat)

export const dataService = {
  getMetadata: async (): Promise<SystemMetadata> => {
    try {
      const docRef = db.collection('system').doc('metadata');
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        return docSnap.data() as SystemMetadata;
      } else {
        const initialData = { lastUpdated: new Date().toISOString().split('T')[0] };
        await docRef.set(initialData);
        return initialData;
      }
    } catch (e) {
      return { lastUpdated: new Date().toISOString().split('T')[0] };
    }
  },

  updateMetadata: async (newDate: string): Promise<void> => {
    const docRef = db.collection('system').doc('metadata');
    await docRef.set({ lastUpdated: newDate }, { merge: true });
  },

  getRecruiters: async (): Promise<User[]> => {
    const usersRef = db.collection('users');
    const q = usersRef.where('rol', '==', 'reclutador');
    const querySnapshot = await q.get();
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  },

  getEmisores: async (currentUser: User): Promise<Emisor[]> => {
    const emisoresRef = db.collection('emisores');
    let q;

    if (currentUser.rol === 'admin') {
      q = emisoresRef;
    } else {
      // Filtramos por el ID del reclutador (que ahora siempre coincide con su UID de Auth)
      q = emisoresRef.where('reclutador_id', '==', currentUser.id);
    }

    const querySnapshot = await q.get();
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
    
    const docRef = await db.collection('emisores').add(newEmisor);
    // @ts-ignore - v8 types might be strict about what is returned
    return { ...newEmisor, id: docRef.id } as Emisor;
  },

  updateHours: async (emisorId: string, newHours: number, adminId: string): Promise<void> => {
    const emisorRef = db.collection('emisores').doc(emisorId);
    const emisorSnap = await emisorRef.get();
    let oldHours = 0;
    if (emisorSnap.exists) {
        const data = emisorSnap.data();
        oldHours = data ? data.horas_mes : 0;
    }
    await emisorRef.update({ horas_mes: newHours });
    await db.collection('historial').add({
        emisor_id: emisorId,
        horas_anteriores: oldHours,
        horas_nuevas: newHours,
        fecha: new Date().toISOString(),
        modificado_por: adminId
    });
  },

  toggleStatus: async (emisorId: string): Promise<void> => {
    const emisorRef = db.collection('emisores').doc(emisorId);
    const emisorSnap = await emisorRef.get();
    
    if (emisorSnap.exists) {
      const data = emisorSnap.data();
      const currentStatus = data ? data.estado : 'activo';
      const newStatus = currentStatus === 'activo' ? 'pausado' : 'activo';
      await emisorRef.update({ estado: newStatus });
    }
  },

  getHistory: async (emisorId?: string): Promise<HistorialHoras[]> => {
    const historyRef = db.collection('historial');
    let q = emisorId ? historyRef.where('emisor_id', '==', emisorId) : historyRef;
    // @ts-ignore - Typescript check for query vs collection usage
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as HistorialHoras));
  }
};