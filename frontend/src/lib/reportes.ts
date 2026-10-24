import type { EstadoCitaReporte, EstadoCotizacionReporte, TipoReporte } from '@/types/reporte';
import type { EstadoVehiculo } from '@/types/vehiculo';

/** Etiquetas de los tipos de reporte (HU17). */
export const TIPO_REPORTE_LABELS: Record<TipoReporte, string> = {
  inventario: 'Inventario',
  ventas: 'Ventas',
  clientes: 'Clientes',
  taller: 'Taller',
  repuestos: 'Repuestos',
};

/** Tipos de reporte que agregan por período y aceptan filtro de fechas (HU17). */
export const TIPOS_CON_FECHAS: TipoReporte[] = ['ventas', 'taller'];

export const ESTADO_VEHICULO_LABELS: Record<EstadoVehiculo, string> = {
  disponible: 'Disponibles',
  reservado: 'Reservados',
  vendido: 'Vendidos',
  no_disponible: 'No disponibles',
};

export const ESTADO_COTIZACION_LABELS: Record<EstadoCotizacionReporte, string> = {
  pendiente: 'Pendientes',
  aceptada: 'Aceptadas',
  rechazada: 'Rechazadas',
  vencida: 'Vencidas',
};

export const ESTADO_CITA_LABELS: Record<EstadoCitaReporte, string> = {
  solicitada: 'Solicitadas',
  confirmada: 'Confirmadas',
  en_atencion: 'En atención',
  finalizada: 'Finalizadas',
  cancelada: 'Canceladas',
};

/** Colores de la serie (alineados a la marca). */
export const COLORES_SERIE = ['#1d6fd8', '#3b8bff', '#0a4c93', '#e31e24', '#f59e0b', '#10b981', '#8b5cf6'];

/** Convierte un objeto `{ clave: número }` en una serie para gráficos. */
export function aSerie(
  datos: Record<string, number>,
  etiquetas: Record<string, string> = {}
): { etiqueta: string; valor: number }[] {
  return Object.entries(datos).map(([clave, valor]) => ({
    etiqueta: etiquetas[clave] ?? clave,
    valor,
  }));
}

/** Mes `AAAA-MM` a etiqueta corta `mmm AA` (p. ej. `2025-03` → `mar 25`). */
export function etiquetaMes(mes: string): string {
  const [anio, numero] = mes.split('-');
  const fecha = new Date(Number(anio), Number(numero) - 1, 1);
  if (Number.isNaN(fecha.getTime())) return mes;
  return fecha.toLocaleDateString('es-BO', { month: 'short', year: '2-digit' });
}

/** Convierte un valor `date` (input) a ISO-8601 completo para la API. */
export function fechaIngresadaAInput(valor: string, finDelDia = false): string | undefined {
  if (!valor) return undefined;
  const fecha = new Date(`${valor}T${finDelDia ? '23:59:59' : '00:00:00'}`);
  return fecha.toISOString();
}
