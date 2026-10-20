import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { citasTallerService } from '@/services/citasTaller';
import type { Mecanico } from '@/types/citaTaller';

/** Hook que carga los mecánicos activos disponibles para asignar (HU14). */
export function useMecanicos() {
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { mecanicos: lista } = await citasTallerService.listMecanicos();
      setMecanicos(lista);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { mecanicos, loading, error, recargar };
}
