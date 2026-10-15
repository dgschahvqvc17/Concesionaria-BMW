import { apiRequest } from '@/lib/api';
import type {
  CreateRepuestoInput,
  RepuestoResponse,
  RepuestosResponse,
  UpdateRepuestoInput,
} from '@/types/repuesto';

/** Acceso a los endpoints del inventario de repuestos (HU04). */
export const repuestosService = {
  list: () => apiRequest<RepuestosResponse>('/api/repuestos'),

  get: (repuestoId: string) => apiRequest<RepuestoResponse>(`/api/repuestos/${repuestoId}`),

  create: (input: CreateRepuestoInput) =>
    apiRequest<RepuestoResponse>('/api/repuestos', { method: 'POST', body: input }),

  update: (repuestoId: string, input: UpdateRepuestoInput) =>
    apiRequest<RepuestoResponse>(`/api/repuestos/${repuestoId}`, { method: 'PATCH', body: input }),
};
