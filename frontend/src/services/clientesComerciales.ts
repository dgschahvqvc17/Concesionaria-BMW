import { apiRequest } from '@/lib/api';
import type {
  ClienteComercialResponse,
  ClientesComercialesResponse,
  CreateClienteComercialInput,
  UpdateClienteComercialInput,
} from '@/types/clienteComercial';

export const clientesComercialesService = {
  list: () => apiRequest<ClientesComercialesResponse>('/api/clientes-comerciales'),
  get: (clienteId: string) => apiRequest<ClienteComercialResponse>(`/api/clientes-comerciales/${clienteId}`),
  create: (input: CreateClienteComercialInput) =>
    apiRequest<ClienteComercialResponse>('/api/clientes-comerciales', { method: 'POST', body: input }),
  update: (clienteId: string, input: UpdateClienteComercialInput) =>
    apiRequest<ClienteComercialResponse>(`/api/clientes-comerciales/${clienteId}`, { method: 'PATCH', body: input }),
  addConsulta: (clienteId: string, consulta: { vehiculo?: string; interes: string; observacion?: string }) =>
    apiRequest<ClienteComercialResponse>(`/api/clientes-comerciales/${clienteId}/consultas`, { method: 'POST', body: consulta }),
};

export type { ClienteComercial, ConsultaCliente, EstadoSeguimiento } from '@/types/clienteComercial';
