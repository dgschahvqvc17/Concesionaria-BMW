import { publicRequest } from '@/lib/api';
import type { RegistroClienteInput, UsuarioResponse } from '@/types/usuario';

/** Acceso al autorregistro público de clientes. */
export const clientesService = {
  registrar: (input: RegistroClienteInput) =>
    publicRequest<UsuarioResponse>('/api/clientes/registro', { method: 'POST', body: input }),
};
