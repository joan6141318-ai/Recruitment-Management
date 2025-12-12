import { User, Emisor, HistorialHoras, Role, SystemMetadata } from '../types';

//Helper for current month
const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

// --- MOCK DATA INITIALIZATION ---

const MOCK_USERS: User[] = [
  // Admins (No password required)
  { id: 'admin1', nombre: 'Joan Admin', correo: 'Joan6141318@gmail.com', rol: 'admin' },
  { id: 'admin2', nombre: 'Eliana Admin', correo: 'elianaloor86@gmail.com', rol: 'admin' },
  
  // Recruiters (Password: Moon2026)
  { id: 'rec1', nombre: 'Juan Reclutador', correo: 'juan@agencia.com', rol: 'reclutador' },
  { id: 'rec2', nombre: 'Maria Talentos', correo: 'maria@agencia.com', rol: 'reclutador' },
];

const MOCK_EMISORES: Emisor[] = [
  // Historical Data
  { id: 'e1', nombre: 'Luna Star', bigo_id: 'luna123', pais: 'Colombia', reclutador_id: 'rec1', horas_mes: 40, mes_entrada: '2023-01', estado: 'activo', fecha_registro: '2023-10-01' },
  { id: 'e2', nombre: 'Sol Music', bigo_id: 'sol_beat', pais: 'Mexico', reclutador_id: 'rec2', horas_mes: 5, mes_entrada: '2023-03', estado: 'pausado', fecha_registro: '2023-10-05' },
  
  // Dynamic Data for "Current Month" testing (To show the new dashboard features)
  { id: 'new1', nombre: 'New Talent A', bigo_id: 'new_a', pais: 'Colombia', reclutador_id: 'rec1', horas_mes: 25, mes_entrada: getCurrentMonth(), estado: 'activo', fecha_registro: new Date().toISOString() },
  { id: 'new2', nombre: 'New Talent B', bigo_id: 'new_b', pais: 'Peru', reclutador_id: 'rec1', horas_mes: 10, mes_entrada: getCurrentMonth(), estado: 'activo', fecha_registro: new Date().toISOString() },
  { id: 'new3', nombre: 'Gamer X', bigo_id: 'game_x', pais: 'Argentina', reclutador_id: 'rec1', horas_mes: 2, mes_entrada: getCurrentMonth(), estado: 'activo', fecha_registro: new Date().toISOString() },
  
  // Admin recruit
  { id: 'e4', nombre: 'Dance Queen', bigo_id: 'dq_99', pais: 'Colombia', reclutador_id: 'admin1', horas_mes: 12, mes_entrada: '2023-08', estado: 'activo', fecha_registro: '2023-10-15' },
];

const MOCK_HISTORIAL: HistorialHoras[] = [];

let SYSTEM_METADATA: SystemMetadata = {
  lastUpdated: new Date().toISOString().split('T')[0] // Default to today YYYY-MM-DD
};

// Helper to simulate DB delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- SERVICES ---

// 1. Auth Simulation
export const authService = {
  login: async (email: string, password?: string): Promise<User | null> => {
    await delay(500);
    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = password?.trim();
    
    // Check if user exists in the "Database"
    let user = MOCK_USERS.find(u => u.correo.toLowerCase() === normalizedEmail);
    
    // 1. Existing User Logic
    if (user) {
      // Admin: Access allowed without password
      if (user.rol === 'admin') {
        return user;
      }
      
      // Recruiter: Must match password
      if (user.rol === 'reclutador') {
        if (cleanPassword === 'Moon2026') {
          return user;
        } else {
          return null; // Wrong password
        }
      }
    }

    // 2. Auto-Registration Logic (If user doesn't exist, but has the Master Key)
    // This allows any recruiter to "Sign Up" just by logging in with the code
    if (cleanPassword === 'Moon2026') {
       const newUser: User = {
         id: 'rec_' + Math.random().toString(36).substr(2, 6),
         nombre: email.split('@')[0], // Use part of email as name
         correo: email,
         rol: 'reclutador'
       };
       MOCK_USERS.push(newUser);
       return newUser;
    }

    // If neither existing user matched nor master password provided
    return null;
  },
  
  // For demo: create a user
  registerUser: async (nombre: string, correo: string, rol: Role): Promise<User> => {
    await delay(500);
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      nombre,
      correo,
      rol
    };
    MOCK_USERS.push(newUser);
    return newUser;
  }
};

// 2. Data Service
export const dataService = {
  // Get Metadata
  getMetadata: async (): Promise<SystemMetadata> => {
    await delay(200);
    return SYSTEM_METADATA;
  },

  // Update Metadata (Admin)
  updateMetadata: async (newDate: string): Promise<void> => {
    await delay(300);
    SYSTEM_METADATA.lastUpdated = newDate;
  },

  // Get Users (Recruiters)
  getRecruiters: async (): Promise<User[]> => {
    await delay(300);
    return MOCK_USERS.filter(u => u.rol === 'reclutador');
  },

  // Get Emisores (filtered by role logic)
  getEmisores: async (currentUser: User): Promise<Emisor[]> => {
    await delay(300);
    if (currentUser.rol === 'admin') {
      return [...MOCK_EMISORES];
    } else {
      return MOCK_EMISORES.filter(e => e.reclutador_id === currentUser.id);
    }
  },

  // Add Emisor
  addEmisor: async (emisorData: Omit<Emisor, 'id' | 'fecha_registro' | 'horas_mes' | 'estado'>, currentUser: User): Promise<Emisor> => {
    await delay(400);
    const newEmisor: Emisor = {
      id: Math.random().toString(36).substr(2, 9),
      ...emisorData,
      horas_mes: 0,
      estado: 'activo',
      fecha_registro: new Date().toISOString(),
    };
    MOCK_EMISORES.push(newEmisor);
    return newEmisor;
  },

  // Update Hours (Admin Only)
  updateHours: async (emisorId: string, newHours: number, adminId: string): Promise<void> => {
    await delay(300);
    const index = MOCK_EMISORES.findIndex(e => e.id === emisorId);
    if (index !== -1) {
      const oldHours = MOCK_EMISORES[index].horas_mes;
      MOCK_EMISORES[index].horas_mes = newHours;

      // Log history
      MOCK_HISTORIAL.push({
        id: Math.random().toString(36).substr(2, 9),
        emisor_id: emisorId,
        horas_anteriores: oldHours,
        horas_nuevas: newHours,
        fecha: new Date().toISOString(),
        modificado_por: adminId
      });
    }
  },

  // Toggle Status (Admin Only)
  toggleStatus: async (emisorId: string): Promise<void> => {
    await delay(200);
    const emisor = MOCK_EMISORES.find(e => e.id === emisorId);
    if (emisor) {
      emisor.estado = emisor.estado === 'activo' ? 'pausado' : 'activo';
    }
  },

  // Get History
  getHistory: async (emisorId?: string): Promise<HistorialHoras[]> => {
    await delay(300);
    if (emisorId) {
      return MOCK_HISTORIAL.filter(h => h.emisor_id === emisorId);
    }
    return [...MOCK_HISTORIAL];
  }
};