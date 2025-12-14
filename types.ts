
export type Role = 'admin' | 'reclutador' | 'banned';

export interface User {
  id: string;
  nombre: string;
  correo: string;
  rol: Role;
  fecha_registro?: string;
}

export type EstadoEmisor = 'activo' | 'pausado';

export interface Emisor {
  id: string;
  nombre: string;
  bigo_id: string;
  pais: string;
  reclutador_id: string;
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
  modificado_por: string;
}

export interface SystemMetadata {
  lastUpdated: string; // Fecha manual puesta por admin
}
