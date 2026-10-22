import type { EstadoVehiculo } from '@/types/vehiculo';

/** Tipos de reporte disponibles (HU17). */
export type TipoReporte = 'inventario' | 'ventas' | 'clientes' | 'taller' | 'repuestos';

/** Rango de fechas opcional para los reportes por período (HU17). */
export interface ReporteFiltro {
  fechaDesde?: string;
  fechaHasta?: string;
}

/** Reporte de inventario de vehículos (HU17). */
export interface ReporteInventario {
  tipo: 'inventario';
  total: number;
  porEstado: Record<EstadoVehiculo, number>;
  valorInventario: number;
}

/** Punto mensual de la serie de ventas (HU17). */
export interface ReporteVentaMes {
  mes: string;
  cantidad: number;
  importe: number;
}

/** Reporte de ventas por período (HU17). */
export interface ReporteVentas {
  tipo: 'ventas';
  total: number;
  totalLista: number;
  totalDescuento: number;
  totalFinal: number;
  ticketPromedio: number;
  porMes: ReporteVentaMes[];
}

/** Estados de una cotización en los reportes (HU17). */
export type EstadoCotizacionReporte = 'pendiente' | 'aceptada' | 'rechazada' | 'vencida';

/** Reporte de cotizaciones y sus estados (HU17). */
export interface ReporteCotizaciones {
  tipo: 'cotizaciones';
  total: number;
  porEstado: Record<EstadoCotizacionReporte, number>;
  importeTotal: number;
}

/** Estados de una cita del taller en los reportes (HU17). */
export type EstadoCitaReporte = 'solicitada' | 'confirmada' | 'en_atencion' | 'finalizada' | 'cancelada';

/** Reporte del taller: citas y órdenes de trabajo (HU17). */
export interface ReporteTaller {
  tipo: 'taller';
  total: number;
  porEstado: Record<EstadoCitaReporte, number>;
  porTipo: Record<string, number>;
  ordenesFinalizadas: number;
  repuestosConsumidos: number;
}

/** Repuesto con existencias bajas (HU17). */
export interface RepuestoBajo {
  repuestoId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  cantidadMinima: number;
}

/** Reporte de repuestos y existencias bajas (HU17). */
export interface ReporteRepuestos {
  tipo: 'repuestos';
  total: number;
  valorInventario: number;
  bajos: RepuestoBajo[];
}

/** Reporte de clientes comerciales por estado de seguimiento (HU17). */
export interface ReporteClientes {
  tipo: 'clientes';
  total: number;
  porEstado: Record<string, number>;
}

/** Resumen consolidado del módulo de reportes (HU17). */
export interface ReporteResumen {
  generadoEn: string;
  periodo: { fechaDesde: string | null; fechaHasta: string | null };
  inventario: ReporteInventario;
  ventas: ReporteVentas;
  cotizaciones: ReporteCotizaciones;
  taller: ReporteTaller;
  repuestos: ReporteRepuestos;
  clientes: ReporteClientes;
}
