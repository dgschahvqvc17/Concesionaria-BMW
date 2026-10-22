import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { auditoriaService } from '@/services/auditoria';
import type { AuditoriaResponse, EventoAuditoria, FiltroAuditoria } from '@/types/auditoria';

/** Hook para consultar el registro de actividad del sistema (HU18). */
export function useAuditoria(filtro: FiltroAuditoria = {}) {
  const { usuarioId, tipo, recursoTipo, recursoId, fechaDesde, fechaHasta } = filtro;

  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(
    async (filtros?: FiltroAuditoria) => {
      setLoading(true);
      setError(null);
      try {
        const respuesta: AuditoriaResponse = await auditoriaService.list(filtros ?? { usuarioId, tipo, recursoTipo, recursoId, fechaDesde, fechaHasta });
        setEventos(respuesta.eventos ?? []);
        setTotal(respuesta.total ?? (respuesta.eventos ?? []).length);
        return respuesta;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fechaDesde, fechaHasta, recursoId, recursoTipo, tipo, usuarioId]
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { eventos, total, loading, error, recargar: cargar };
}
