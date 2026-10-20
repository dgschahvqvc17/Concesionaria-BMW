import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { notificacionesService, type NotificacionesFiltro } from '@/services/notificaciones';
import type { Notificacion } from '@/types/notificacion';

/** Hook que encapsula la carga y el envío de notificaciones por correo (HU12). */
export function useNotificaciones(filtro: NotificacionesFiltro = {}) {
  const { tipo, estado, recursoId } = filtro;

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { notificaciones: lista } = await notificacionesService.list({ tipo, estado, recursoId });
      setNotificaciones(lista);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tipo, estado, recursoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const enviar = useCallback(
    async (eventoId: string): Promise<string> => {
      const { mailto } = await notificacionesService.enviar(eventoId);
      await cargar();
      return mailto;
    },
    [cargar]
  );

  return { notificaciones, loading, error, recargar: cargar, enviar };
}
