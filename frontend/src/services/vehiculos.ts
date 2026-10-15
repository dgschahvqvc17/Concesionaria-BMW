import { apiRequest } from '@/lib/api';
import type {
  CreateVehiculoInput,
  PresignFotoResponse,
  UpdateVehiculoInput,
  VehiculoResponse,
  VehiculosResponse,
} from '@/types/vehiculo';

/** Acceso a los endpoints de inventario de vehículos (HU03). */
export const vehiculosService = {
  list: () => apiRequest<VehiculosResponse>('/api/vehiculos'),

  get: (vehiculoId: string) => apiRequest<VehiculoResponse>(`/api/vehiculos/${vehiculoId}`),

  create: (input: CreateVehiculoInput) =>
    apiRequest<VehiculoResponse>('/api/vehiculos', { method: 'POST', body: input }),

  update: (vehiculoId: string, input: UpdateVehiculoInput) =>
    apiRequest<VehiculoResponse>(`/api/vehiculos/${vehiculoId}`, { method: 'PATCH', body: input }),

  presignFoto: (contentType: string) =>
    apiRequest<PresignFotoResponse>('/api/vehiculos/fotos/presign', {
      method: 'POST',
      body: { contentType },
    }),

  /** Sube una fotografía directamente a S3 usando la URL prefirmada. */
  async uploadFoto(file: File): Promise<string> {
    const { key, uploadUrl } = await vehiculosService.presignFoto(file.type);
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!response.ok) {
      throw new Error('No se pudo subir la fotografía.');
    }
    return key;
  },
};
