import { apiRequest } from '@/lib/api';
import type {
  ArchivoTallerInput,
  AsignarCitaInput,
  BuscarHistorialInput,
  CancelarCitaInput,
  CategoriaArchivoTaller,
  CitaResponse,
  CitasResponse,
  CreateCitaTallerInput,
  EstadoCitaInput,
  HistorialServicios,
  MecanicosResponse,
  RegistrarAvanceInput,
  ReprogramarCitaInput,
} from '@/types/citaTaller';

export interface CitasFiltro {
  clienteId?: string;
  vehiculoId?: string;
  mecanicoId?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

function queryString(filtro?: CitasFiltro): string {
  if (!filtro) return '';
  const params = new URLSearchParams();
  if (filtro.clienteId) params.set('clienteId', filtro.clienteId);
  if (filtro.vehiculoId) params.set('vehiculoId', filtro.vehiculoId);
  if (filtro.mecanicoId) params.set('mecanicoId', filtro.mecanicoId);
  if (filtro.estado) params.set('estado', filtro.estado);
  if (filtro.fechaDesde) params.set('fechaDesde', filtro.fechaDesde);
  if (filtro.fechaHasta) params.set('fechaHasta', filtro.fechaHasta);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Acceso a los endpoints de citas del taller (HU13 + HU14). */
export const citasTallerService = {
  list: (filtro?: CitasFiltro) => apiRequest<CitasResponse>(`/api/citas-taller${queryString(filtro)}`),

  get: (citaId: string) => apiRequest<CitaResponse>(`/api/citas-taller/${citaId}`),

  listMecanicos: () => apiRequest<MecanicosResponse>('/api/usuarios/mecanicos'),

  create: (input: CreateCitaTallerInput) =>
    apiRequest<CitaResponse>('/api/citas-taller', { method: 'POST', body: input }),

  confirmar: (citaId: string, input: EstadoCitaInput) =>
    apiRequest<CitaResponse>(`/api/citas-taller/${citaId}/confirmar`, { method: 'POST', body: input }),

  reprogramar: (citaId: string, input: ReprogramarCitaInput) =>
    apiRequest<CitaResponse>(`/api/citas-taller/${citaId}/reprogramar`, { method: 'POST', body: input }),

  iniciar: (citaId: string, input: EstadoCitaInput) =>
    apiRequest<CitaResponse>(`/api/citas-taller/${citaId}/iniciar`, { method: 'POST', body: input }),

  finalizar: (citaId: string, input: EstadoCitaInput) =>
    apiRequest<CitaResponse>(`/api/citas-taller/${citaId}/finalizar`, { method: 'POST', body: input }),

  cancelar: (citaId: string, input: CancelarCitaInput) =>
    apiRequest<CitaResponse>(`/api/citas-taller/${citaId}/cancelar`, { method: 'POST', body: input }),

  asignar: (citaId: string, input: AsignarCitaInput) =>
    apiRequest<CitaResponse>(`/api/citas-taller/${citaId}/asignar`, { method: 'POST', body: input }),

  registrarAvance: (citaId: string, input: RegistrarAvanceInput) =>
    apiRequest<CitaResponse>(`/api/citas-taller/${citaId}/avances`, { method: 'POST', body: input }),

  presignArchivoTaller: (citaId: string, input: PresignArchivoTallerInput) =>
    apiRequest<PresignArchivoTallerResponse>(`/api/citas-taller/${citaId}/archivos/presign`, {
      method: 'POST',
      body: input,
    }),

  /** Sube un archivo técnico directamente a S3 con la URL prefirmada (HU15). */
  async subirArchivoTaller(
    citaId: string,
    file: File,
    categoria: CategoriaArchivoTaller
  ): Promise<ArchivoTallerInput> {
    const { key, uploadUrl } = await citasTallerService.presignArchivoTaller(citaId, {
      categoria,
      contentType: file.type,
      nombre: file.name,
      size: file.size,
    });

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!response.ok) {
      throw new Error('No se pudo subir el archivo. Inténtalo nuevamente.');
    }

    return { key, nombre: file.name };
  },

  /** Busca el vehículo por VIN o id y devuelve su historial de servicios (HU16). */
  historial: (input: BuscarHistorialInput) => {
    const params = new URLSearchParams();
    if (input.vin) params.set('vin', input.vin);
    if (input.vehiculoId) params.set('vehiculoId', input.vehiculoId);
    return apiRequest<HistorialServicios>(`/api/citas-taller/historial?${params.toString()}`);
  },

  /** Historial de servicios de un vehículo concreto (HU16). */
  historialPorVehiculo: (vehiculoId: string) =>
    apiRequest<HistorialServicios>(`/api/citas-taller/historial/${vehiculoId}`),
};

/** Entrada de la petición de URL prefirmada de un archivo del taller (HU15). */
export interface PresignArchivoTallerInput {
  categoria: CategoriaArchivoTaller;
  contentType: string;
  nombre: string;
  size: number;
}

/** Respuesta con la clave y la URL prefirmada de subida (HU15). */
export interface PresignArchivoTallerResponse {
  key: string;
  uploadUrl: string;
  maxSize: number;
}

export type { CitaTaller, EstadoCita, TipoServicioCita, Mecanico } from '@/types/citaTaller';
