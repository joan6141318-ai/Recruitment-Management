
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
  signatureName?: string; // Nombre para la firma personalizada
  // Mapa de disponibilidad: "YYYY-MM_userId": boolean
  publishedInvoices?: Record<string, boolean>;
  // Mapa de ajustes manuales globales: "YYYY-MM_userId": monto
  pagoAjustes?: Record<string, number>;
  // Mapa de ajustes manuales de cantidad: "YYYY-MM_userId": total
  totalEmisoresAjustes?: Record<string, number>;
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
  genero?: 'M' | 'F'; // M: Masculino, F: Femenino
  isManualEntry?: boolean; // Identificador para registros agregados manualmente desde factura
  pago_meta?: number;      // Monto manual por meta de semillas
  pago_horas?: number;     // Monto manual por cumplimiento de horas
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
  totalHours: number;
  topRecruiter?: string;
}
