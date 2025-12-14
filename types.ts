export type Role = 'admin' | 'reclutador';

export interface User {
  id: string;
  nombre: string;
  correo: string;
  rol: Role;
}

export type EstadoEmisor = 'activo' | 'pausado';

export interface Emisor {
  id: string;
  nombre: string;
  bigo_id: string;
  pais: string;
  reclutador_id: string; // ID of the user who recruited them
  horas_mes: number;
  mes_entrada: string; // Format: YYYY-MM
  estado: EstadoEmisor;
  fecha_registro: string;
}

export interface HistorialHoras {
  id: string;
  emisor_id: string;
  horas_anteriores: number;
  horas_nuevas: number;
  fecha: string;
  modificado_por: string; // User ID
}

export interface SystemMetadata {
  lastUpdated: string; // ISO Date string
}

// Stats for dashboard
export interface DashboardStats {
  totalEmisores: number;
  activeEmisores: number;
  totalHoras: number;
  topRecruiter?: string;
}