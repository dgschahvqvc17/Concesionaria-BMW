import type { CitaTaller, EstadoCita, TipoAsignacionCita, TipoServicioCita } from '@/types/citaTaller';

export const ESTADOS_CITA: EstadoCita[] = ['solicitada', 'confirmada', 'en_atencion', 'finalizada', 'cancelada'];

export const ESTADO_CITA_LABELS: Record<EstadoCita, string> = {
  solicitada: 'Solicitada',
  confirmada: 'Confirmada',
  en_atencion: 'En atención',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
};

/** Clases de color por estado (fondo suave + texto), alineadas a los primitivos. */
export const ESTADO_CITA_STYLES: Record<EstadoCita, string> = {
  solicitada: 'border-transparent bg-amber-500/10 text-amber-700',
  confirmada: 'border-transparent bg-brand-blue/10 text-brand-blue',
  en_atencion: 'border-transparent bg-sky-500/10 text-sky-700',
  finalizada: 'border-transparent bg-emerald-500/10 text-emerald-700',
  cancelada: 'border-transparent bg-rose-500/10 text-rose-700',
};

export const TIPOS_SERVICIO: TipoServicioCita[] = ['mantenimiento', 'reparacion', 'diagnostico', 'revision', 'otro'];

export const TIPO_SERVICIO_LABELS: Record<TipoServicioCita, string> = {
  mantenimiento: 'Mantenimiento',
  reparacion: 'Reparación',
  diagnostico: 'Diagnóstico',
  revision: 'Revisión',
  otro: 'Otro',
};

/** Horario de atención del taller configurado (hora local), espejo del backend. */
export const HORARIO_INICIO = 8;
export const HORARIO_FIN = 18;

/** Granularidad de la agenda: las horas de inicio se agendan de 15 en 15 minutos. */
export const PASO_MINUTOS = 15;

export const DURACION_DEFECTO = 60;
export const DURACION_MIN = 15;
export const DURACION_MAX = 480;

export function finDeCita(cita: CitaTaller): number {
  return new Date(cita.fechaHora).getTime() + cita.duracionMinutos * 60000;
}

export function puedeConfirmarse(cita: CitaTaller): boolean {
  return cita.estado === 'solicitada';
}

export function puedeReprogramarse(cita: CitaTaller): boolean {
  return cita.estado === 'solicitada' || cita.estado === 'confirmada';
}

export function puedeCancelarse(cita: CitaTaller): boolean {
  return puedeReprogramarse(cita);
}

export function puedeIniciarse(cita: CitaTaller): boolean {
  return cita.estado === 'confirmada';
}

export function puedeFinalizarse(cita: CitaTaller): boolean {
  return cita.estado === 'en_atencion';
}

/** Estados en los que la cita admite asignación o reasignación de mecánico (HU14). */
export const ESTADOS_ASIGNABLES: EstadoCita[] = ['confirmada', 'en_atencion'];

export function puedeAsignarseMecanico(cita: CitaTaller): boolean {
  return ESTADOS_ASIGNABLES.includes(cita.estado);
}

/** Estado de la asignación de la orden de trabajo (HU14). */
export function etiquetaAsignacion(cita: CitaTaller): string {
  if (cita.mecanico?.nombre) return cita.mecanico.nombre;
  if (cita.mecanicoId) return 'Asignada';
  if (puedeAsignarseMecanico(cita)) return 'Sin asignar';
  return '—';
}

export const TIPO_ASIGNACION_LABELS: Record<TipoAsignacionCita, string> = {
  asignada: 'Asignada',
  reasignada: 'Reasignada',
};

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

/** Ventana de tiempo que ocupa la cita: «10:00 – 11:00». */
export function rangoHorario(cita: CitaTaller): string {
  return `${formatHora(cita.fechaHora)} – ${formatHora(new Date(finDeCita(cita)).toISOString())}`;
}

/** Valor inicial para un input `datetime-local` (mañana a las 10:00). */
export function fechaHoraPorDefecto(): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 1);
  fecha.setHours(10, 0, 0, 0);
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/** Valida una fecha-hora de agenda local (futura, dentro del horario y alineada al paso). */
export function validarFechaCita(valor: string): string | null {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'La fecha y hora no son válidas.';
  if (fecha.getTime() <= Date.now()) return 'La fecha de la cita debe ser futura.';
  if (fecha.getHours() < HORARIO_INICIO || fecha.getHours() >= HORARIO_FIN) {
    return `El horario de atención es de ${HORARIO_INICIO}:00 a ${HORARIO_FIN}:00.`;
  }
  if (fecha.getMinutes() % PASO_MINUTOS !== 0) {
    return `Las citas se agendan cada ${PASO_MINUTOS} minutos.`;
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
