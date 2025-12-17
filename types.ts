export type Role = 'admin' | 'reclutador';

export interface User {
  id: string;
  nombre: string;
  correo: string;
  rol: Role;
  activo: boolean; // Control de acceso
}

export type EstadoEmisor = 'activo' | 'pausado';

export interface Emisor {
  id: string;
  nombre: string;
  bigo_id: string;
  pais: string;
  reclutador_id: string; // ID of the user who recruited them
  horas_mes: number;
  semillas_mes: number; // NUEVO: Semillas generadas en el mes
  mes_entrada: string; // Format: YYYY-MM
  estado: EstadoEmisor;
  fecha_registro: string;
  es_compartido?: boolean; // NUEVO: Si es true, todos los reclutadores pueden verlo
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