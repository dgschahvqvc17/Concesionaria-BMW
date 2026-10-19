import { useCallback, useEffect, useMemo, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { cotizacionesService } from '@/services/cotizaciones';
import type { Cotizacion, CreateCotizacionInput, UpdateCotizacionInput } from '@/types/cotizacion';

/** Hook que encapsula la carga y mutación de cotizaciones (HU08). */
export function useCotizaciones(filtro: { clienteId?: string } = {}) {
  const { clienteId } = filtro;

  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { cotizaciones: lista } = await cotizacionesService.list(clienteId ? { clienteId } : undefined);
      setCotizaciones(lista);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const crear = useCallback(
    async (input: CreateCotizacionInput): Promise<Cotizacion> => {
      const { cotizacion } = await cotizacionesService.create(input);
      await cargar();
      return cotizacion;
    },
    [cargar]
  );

  const actualizar = useCallback(
    async (cotizacionId: string, input: UpdateCotizacionInput): Promise<Cotizacion> => {
      const { cotizacion } = await cotizacionesService.update(cotizacionId, input);
      await cargar();
      return cotizacion;
    },
    [cargar]
  );

  const ordenadas = useMemo(
    () => cotizaciones.slice().sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
    [cotizaciones]
  );

  return { cotizaciones: ordenadas, loading, error, recargar: cargar, crear, actualizar };
}
