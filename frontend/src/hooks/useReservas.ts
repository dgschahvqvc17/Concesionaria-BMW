import { useCallback, useEffect, useMemo, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { reservasService } from '@/services/reservas';
import type {
  CancelarReservaInput,
  ConvertirReservaInput,
  CreateReservaInput,
  EstadoReserva,
  Reserva,
} from '@/types/reserva';

interface UseReservasFiltro {
  clienteId?: string;
  vehiculoId?: string;
  estado?: EstadoReserva;
}

/** Hook que encapsula la carga y mutación de reservas (HU09). */
export function useReservas(filtro: UseReservasFiltro = {}) {
  const { clienteId, vehiculoId, estado } = filtro;

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { reservas: lista } = await reservasService.list({ clienteId, vehiculoId, estado });
      setReservas(lista);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clienteId, vehiculoId, estado]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const crear = useCallback(
    async (input: CreateReservaInput): Promise<Reserva> => {
      const { reserva } = await reservasService.create(input);
      await cargar();
      return reserva;
    },
    [cargar]
  );

  const cancelar = useCallback(
    async (reservaId: string, input: CancelarReservaInput): Promise<Reserva> => {
      const { reserva } = await reservasService.cancelar(reservaId, input);
      await cargar();
      return reserva;
    },
    [cargar]
  );

  const convertir = useCallback(
    async (reservaId: string, input: ConvertirReservaInput): Promise<Reserva> => {
      const { reserva } = await reservasService.convertir(reservaId, input);
      await cargar();
      return reserva;
    },
    [cargar]
  );

  const ordenadas = useMemo(
    () => reservas.slice().sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))),
    [reservas]
  );

  return { reservas: ordenadas, loading, error, recargar: cargar, crear, cancelar, convertir };
}
