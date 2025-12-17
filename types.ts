export type Role = 'admin' | 'reclutador';

export interface User {
  id: string;
  nombre: string;
  correo: string;
  rol: Role;
  activo: boolean; // Control de acceso
}

export interface CommissionBracket {
  seeds: number;
  usd: number;
}

export interface InvoiceConfig {
  agenciaNombre: string;
  agenciaInfo: string;
  conceptoSector: string;
  brackets: CommissionBracket[];
  institucionPago: string;
  referenciaId?: string; // ID manual agregado por el administrador
  // Mapa de disponibilidad: "YYYY-MM_userId": boolean
  publishedInvoices?: Record<string, boolean>;
}

export type EstadoEmisor = 'activo' | 'pausado';

export interface Emisor {
  id: string;
  nombre: string;
  bigo_id: string;
  pais: string;
  reclutador_id: string; 
  horas_mes: number;
  semillas_mes: number; 
  mes_entrada: string; 
  estado: EstadoEmisor;
  fecha_registro: string;
  es_compartido?: boolean; 
  isManualEntry?: boolean; // Identificador para registros agregados manualmente desde factura
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
  lastUpdated: string; 
}

export interface DashboardStats {
  totalEmisores: number;
  activeEmisores: number;
  totalHoras: number;
  topRecruiter?: string;
}