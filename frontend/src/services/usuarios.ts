import { apiRequest } from '@/lib/api';
import type {
  CreateUsuarioInput,
  UpdateUsuarioInput,
  UsuarioResponse,
  UsuariosResponse,
} from '@/types/usuario';

/** Acceso a los endpoints de gestión de usuarios (HU02). */
export const usuariosService = {
  list: () => apiRequest<UsuariosResponse>('/api/usuarios'),

  get: (userId: string) => apiRequest<UsuarioResponse>(`/api/usuarios/${userId}`),

  create: (input: CreateUsuarioInput) =>
    apiRequest<UsuarioResponse>('/api/usuarios', { method: 'POST', body: input }),

  update: (userId: string, input: UpdateUsuarioInput) =>
    apiRequest<UsuarioResponse>(`/api/usuarios/${userId}`, { method: 'PATCH', body: input }),

  setEstado: (userId: string, estado: 'activo' | 'inactivo') =>
    apiRequest<UsuarioResponse>(`/api/usuarios/${userId}/estado`, {
      method: 'PATCH',
      body: { estado },
    }),
};
