import { useCallback, useEffect, useMemo, useState } from 'react';

import { clientesComercialesService } from '@/services/clientesComerciales';
import type {
  ClienteComercial,
  CreateClienteComercialInput,
  UpdateClienteComercialInput,
} from '@/types/clienteComercial';

export function useClientesComerciales() {
  const [clientes, setClientes] = useState<ClienteComercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientesComercialesService.list();
      setClientes(res.clientes);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar clientes comerciales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const crear = useCallback(async (input: CreateClienteComercialInput) => {
    const res = await clientesComercialesService.create(input);
    await cargar();
    return res.cliente;
  }, [cargar]);

  const actualizar = useCallback(async (clienteId: string, input: UpdateClienteComercialInput) => {
    const res = await clientesComercialesService.update(clienteId, input);
    await cargar();
    return res.cliente;
  }, [cargar]);

  const agregarConsulta = useCallback(async (clienteId: string, consulta: any) => {
    const res = await clientesComercialesService.addConsulta(clienteId, consulta);
    await cargar();
    return res.cliente;
  }, [cargar]);

  const ordenados = useMemo(() => clientes.slice().sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||'')), [clientes]);

  return { clientes: ordenados, loading, error, recargar: cargar, crear, actualizar, agregarConsulta };
}
