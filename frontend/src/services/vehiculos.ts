import { apiRequest } from '@/lib/api';
import type {
  CategoriaArchivo,
  CreateVehiculoInput,
  PresignArchivoInput,
  PresignArchivoResponse,
  UpdateVehiculoInput,
  VehiculoResponse,
  VehiculosResponse,
} from '@/types/vehiculo';

/** Archivo subido a S3, listo para asociarse a un vehículo. */
export interface ArchivoSubido {
  key: string;
  nombre: string;
  contentType: string;
  size: number;
}

/** Acceso a los endpoints de inventario de vehículos (HU03) y sus archivos (HU06). */
export const vehiculosService = {
  list: () => apiRequest<VehiculosResponse>('/api/vehiculos'),

  get: (vehiculoId: string) => apiRequest<VehiculoResponse>(`/api/vehiculos/${vehiculoId}`),

  create: (input: CreateVehiculoInput) =>
    apiRequest<VehiculoResponse>('/api/vehiculos', { method: 'POST', body: input }),

  update: (vehiculoId: string, input: UpdateVehiculoInput) =>
    apiRequest<VehiculoResponse>(`/api/vehiculos/${vehiculoId}`, { method: 'PATCH', body: input }),

  presignArchivo: (input: PresignArchivoInput) =>
    apiRequest<PresignArchivoResponse>('/api/vehiculos/archivos/presign', {
      method: 'POST',
      body: input,
    }),

  /** Sube un archivo directamente a S3 usando la URL prefirmada. */
  async subirArchivo(file: File, categoria: CategoriaArchivo): Promise<ArchivoSubido> {
    const { key, uploadUrl } = await vehiculosService.presignArchivo({
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

    return { key, nombre: file.name, contentType: file.type, size: file.size };
  },
};
