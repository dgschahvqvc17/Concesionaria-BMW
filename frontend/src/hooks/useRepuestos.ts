import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { repuestosService } from '@/services/repuestos';
import type { CreateRepuestoInput, Repuesto, UpdateRepuestoInput } from '@/types/repuesto';

function ordenar(repuestos: Repuesto[]): Repuesto[] {
  return [...repuestos].sort((a, b) => a.codigo.localeCompare(b.codigo, 'es'));
}

/** Hook que encapsula la carga y mutación del inventario de repuestos (HU04). */
export function useRepuestos() {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { repuestos: lista } = await repuestosService.list();
      setRepuestos(ordenar(lista));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const crear = useCallback(async (input: CreateRepuestoInput): Promise<Repuesto> => {
    const { repuesto } = await repuestosService.create(input);
    setRepuestos((prev) => ordenar([...prev, repuesto]));
    return repuesto;
  }, []);

  const actualizar = useCallback(
    async (repuestoId: string, input: UpdateRepuestoInput): Promise<Repuesto> => {
      const { repuesto } = await repuestosService.update(repuestoId, input);
      setRepuestos((prev) => ordenar(prev.map((r) => (r.repuestoId === repuestoId ? repuesto : r))));
      return repuesto;
    },
    []
  );

  return { repuestos, loading, error, recargar, crear, actualizar };
}
