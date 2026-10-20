import type { EstadoPrueba, OrigenPrueba, PruebaManejo } from '@/types/pruebaManejo';

export const ESTADOS_PRUEBA: EstadoPrueba[] = ['pendiente', 'confirmada', 'realizada', 'cancelada'];

export const ESTADO_PRUEBA_LABELS: Record<EstadoPrueba, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

/** Clases de color por estado (fondo suave + texto), alineadas a los primitivos. */
export const ESTADO_PRUEBA_STYLES: Record<EstadoPrueba, string> = {
  pendiente: 'border-transparent bg-amber-500/10 text-amber-700',
  confirmada: 'border-transparent bg-brand-blue/10 text-brand-blue',
  realizada: 'border-transparent bg-emerald-500/10 text-emerald-700',
  cancelada: 'border-transparent bg-rose-500/10 text-rose-700',
};

export const ORIGEN_PRUEBA_LABELS: Record<OrigenPrueba, string> = {
  catalogo: 'Catálogo web',
  cliente: 'Cliente',
  interno: 'Interno',
};

/** Ventana de atención de pruebas (hora local), espejo del backend. */
export const HORARIO_INICIO = 8;
export const HORARIO_FIN = 18;

/** Granularidad de la agenda: las horas de inicio se agendan de 15 en 15 minutos. */
export const PASO_MINUTOS = 15;

export const DURACION_DEFECTO = 60;
export const DURACION_MIN = 15;
export const DURACION_MAX = 180;

/** Un vehículo es elegible para pruebas si está publicado y no está vendido ni dado de baja. */
export function esVehiculoParaPrueba(vehiculo: { estado: string; publicado?: boolean }): boolean {
  if (vehiculo.publicado === false) return false;
  return vehiculo.estado === 'disponible' || vehiculo.estado === 'reservado';
}

export function finDePrueba(prueba: PruebaManejo): number {
  return new Date(prueba.fechaHora).getTime() + prueba.duracionMinutos * 60000;
}

export function puedeConfirmarse(prueba: PruebaManejo): boolean {
  return prueba.estado === 'pendiente';
}

export function puedeReprogramarse(prueba: PruebaManejo): boolean {
  return prueba.estado === 'pendiente' || prueba.estado === 'confirmada';
}

export function puedeCancelarse(prueba: PruebaManejo): boolean {
  return puedeReprogramarse(prueba);
}

export function puedeRealizarse(prueba: PruebaManejo): boolean {
  return prueba.estado === 'confirmada';
}

export function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

/** Ventana de tiempo que ocupa la prueba: «10:00 – 11:00». */
export function rangoHorario(prueba: PruebaManejo): string {
  return `${formatHora(prueba.fechaHora)} – ${formatHora(new Date(finDePrueba(prueba)).toISOString())}`;
}

/** Valor inicial para un input `datetime-local` (mañana a las 10:00, redondeado al paso). */
export function fechaHoraPorDefecto(): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 1);
  fecha.setHours(10, 0, 0, 0);
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/** Valida una fecha-hora de agenda local (futura, dentro del horario y alineada al paso). */
export function validarFechaPrueba(valor: string): string | null {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'La fecha y hora no son válidas.';
  if (fecha.getTime() <= Date.now()) return 'La fecha de la prueba debe ser futura.';
  if (fecha.getHours() < HORARIO_INICIO || fecha.getHours() >= HORARIO_FIN) {
    return `La hora debe estar entre ${HORARIO_INICIO}:00 y ${HORARIO_FIN}:00.`;
  }
  if (fecha.getMinutes() % PASO_MINUTOS !== 0) {
    return `Las horas se agendan cada ${PASO_MINUTOS} minutos.`;
  }
  return null;
}

/** Convierte un valor `datetime-local` a ISO (UTC) para la API. */
export function aIsoLocal(valor: string): string {
  return new Date(valor).toISOString();
}

/** Formato local para un input `datetime-local` a partir de una fecha ISO. */
export function aValorLocal(iso: string): string {
  const fecha = new Date(iso);
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
