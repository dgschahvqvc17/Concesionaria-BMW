import { useCallback, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { citasTallerService } from '@/services/citasTaller';
import type { BuscarHistorialInput, HistorialServicios } from '@/types/citaTaller';

/** Hook para consultar el historial de servicios de un vehículo (HU16). */
export function useHistorialServicios() {
  const [historial, setHistorial] = useState<HistorialServicios | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buscado, setBuscado] = useState(false);

  const buscar = useCallback(async (input: BuscarHistorialInput) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await citasTallerService.historial(input);
      setHistorial(resultado);
      return resultado;
    } catch (err) {
      setHistorial(null);
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setBuscado(true);
      setLoading(false);
    }
  }, []);

  const limpiar = useCallback(() => {
    setHistorial(null);
    setError(null);
    setBuscado(false);
  }, []);

  return { historial, loading, error, buscado, buscar, limpiar };
}
