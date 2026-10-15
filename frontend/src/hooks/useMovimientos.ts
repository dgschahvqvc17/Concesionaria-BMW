import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { movimientosService } from '@/services/movimientos';
import type { CreateMovimientoInput, Movimiento, TipoMovimiento } from '@/types/repuesto';

interface UseMovimientosParams {
  repuestoId?: string;
  tipo?: TipoMovimiento;
}

/** Hook que encapsula la carga y registro de movimientos de inventario (HU04). */
export function useMovimientos({ repuestoId, tipo }: UseMovimientosParams = {}) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { movimientos: lista } = await movimientosService.list({ repuestoId, tipo });
      setMovimientos(lista);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [repuestoId, tipo]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const registrar = useCallback(
    async (input: CreateMovimientoInput) => {
      const respuesta = await movimientosService.create(input);
      await recargar();
      return respuesta;
    },
    [recargar]
  );

  return { movimientos, loading, error, recargar, registrar };
}
