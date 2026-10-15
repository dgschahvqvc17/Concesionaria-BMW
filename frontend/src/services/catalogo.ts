import { publicRequest } from '@/lib/api';
import type { CatalogoResponse, CatalogoVehiculoResponse } from '@/types/catalogo';

/** Acceso público al catálogo web de vehículos (HU05), sin autenticación. */
export const catalogoService = {
  list: () => publicRequest<CatalogoResponse>('/api/catalogo', { method: 'GET' }),

  get: (vehiculoId: string) =>
    publicRequest<CatalogoVehiculoResponse>(`/api/catalogo/${vehiculoId}`, { method: 'GET' }),
};
