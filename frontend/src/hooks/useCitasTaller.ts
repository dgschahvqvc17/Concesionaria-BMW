import { useCallback, useEffect, useMemo, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { citasTallerService } from '@/services/citasTaller';
import type {
  CancelarCitaInput,
  CitaTaller,
  CreateCitaTallerInput,
  EstadoCita,
  EstadoCitaInput,
  ReprogramarCitaInput,
} from '@/types/citaTaller';

interface UseCitasFiltro {
  clienteId?: string;
  vehiculoId?: string;
  estado?: EstadoCita;
}

/** Hook que encapsula la carga y mutación de citas del taller (HU13). */
export function useCitasTaller(filtro: UseCitasFiltro = {}) {
  const { clienteId, vehiculoId, estado } = filtro;

  const [citas, setCitas] = useState<CitaTaller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { citas: lista } = await citasTallerService.list({ clienteId, vehiculoId, estado });
      setCitas(lista);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clienteId, vehiculoId, estado]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const accion = useCallback(
    async (ejecutar: () => Promise<{ cita: CitaTaller }>): Promise<CitaTaller> => {
      const { cita } = await ejecutar();
      await cargar();
      return cita;
    },
    [cargar]
  );

  const crear = useCallback(
    (input: CreateCitaTallerInput) => accion(() => citasTallerService.create(input)),
    [accion]
  );

  const confirmar = useCallback(
    (citaId: string, input: EstadoCitaInput) => accion(() => citasTallerService.confirmar(citaId, input)),
    [accion]
  );

  const reprogramar = useCallback(
    (citaId: string, input: ReprogramarCitaInput) => accion(() => citasTallerService.reprogramar(citaId, input)),
    [accion]
  );

  const iniciar = useCallback(
    (citaId: string, input: EstadoCitaInput) => accion(() => citasTallerService.iniciar(citaId, input)),
    [accion]
  );

  const finalizar = useCallback(
    (citaId: string, input: EstadoCitaInput) => accion(() => citasTallerService.finalizar(citaId, input)),
    [accion]
  );

  const cancelar = useCallback(
    (citaId: string, input: CancelarCitaInput) => accion(() => citasTallerService.cancelar(citaId, input)),
    [accion]
  );

  const ordenadas = useMemo(
    () => citas.slice().sort((a, b) => String(a.fechaHora ?? '').localeCompare(String(b.fechaHora ?? ''))),
    [citas]
  );

  return {
    citas: ordenadas,
    loading,
    error,
    recargar: cargar,
    crear,
    confirmar,
    reprogramar,
    iniciar,
    finalizar,
    cancelar,
  };
}
