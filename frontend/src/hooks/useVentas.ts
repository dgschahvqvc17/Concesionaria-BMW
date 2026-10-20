import { useCallback, useEffect, useMemo, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { ventasService } from '@/services/ventas';
import type { CreateVentaInput, Venta } from '@/types/venta';

/** Hook que encapsula la carga y el registro de ventas (HU10). */
export function useVentas(filtro: { clienteId?: string; vehiculoId?: string } = {}) {
  const { clienteId, vehiculoId } = filtro;

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { ventas: lista } = await ventasService.list({ clienteId, vehiculoId });
      setVentas(lista);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clienteId, vehiculoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const crear = useCallback(
    async (input: CreateVentaInput): Promise<Venta> => {
      const { venta } = await ventasService.create(input);
      await cargar();
      return venta;
    },
    [cargar]
  );

  const ordenadas = useMemo(
    () => ventas.slice().sort((a, b) => String(b.fechaVenta ?? '').localeCompare(String(a.fechaVenta ?? ''))),
    [ventas]
  );

  return { ventas: ordenadas, loading, error, recargar: cargar, crear };
}
