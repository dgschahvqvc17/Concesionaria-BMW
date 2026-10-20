import { useCallback, useEffect, useMemo, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { pruebasManejoService } from '@/services/pruebasManejo';
import type {
  CancelarPruebaInput,
  ConfirmarPruebaInput,
  CreatePruebaManejoInput,
  EstadoPrueba,
  PruebaManejo,
  RealizarPruebaInput,
  ReprogramarPruebaInput,
} from '@/types/pruebaManejo';

interface UsePruebasFiltro {
  clienteId?: string;
  vehiculoId?: string;
  estado?: EstadoPrueba;
}

/** Hook que encapsula la carga y mutación de pruebas de manejo (HU11). */
export function usePruebasManejo(filtro: UsePruebasFiltro = {}) {
  const { clienteId, vehiculoId, estado } = filtro;

  const [pruebas, setPruebas] = useState<PruebaManejo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { pruebas: lista } = await pruebasManejoService.list({ clienteId, vehiculoId, estado });
      setPruebas(lista);
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
    async (ejecutar: () => Promise<{ prueba: PruebaManejo }>): Promise<PruebaManejo> => {
      const { prueba } = await ejecutar();
      await cargar();
      return prueba;
    },
    [cargar]
  );

  const crear = useCallback(
    (input: CreatePruebaManejoInput) => accion(() => pruebasManejoService.create(input)),
    [accion]
  );

  const confirmar = useCallback(
    (pruebaId: string, input: ConfirmarPruebaInput) => accion(() => pruebasManejoService.confirmar(pruebaId, input)),
    [accion]
  );

  const reprogramar = useCallback(
    (pruebaId: string, input: ReprogramarPruebaInput) =>
      accion(() => pruebasManejoService.reprogramar(pruebaId, input)),
    [accion]
  );

  const cancelar = useCallback(
    (pruebaId: string, input: CancelarPruebaInput) => accion(() => pruebasManejoService.cancelar(pruebaId, input)),
    [accion]
  );

  const realizar = useCallback(
    (pruebaId: string, input: RealizarPruebaInput) => accion(() => pruebasManejoService.realizar(pruebaId, input)),
    [accion]
  );

  const ordenadas = useMemo(
    () => pruebas.slice().sort((a, b) => String(a.fechaHora ?? '').localeCompare(String(b.fechaHora ?? ''))),
    [pruebas]
  );

  return { pruebas: ordenadas, loading, error, recargar: cargar, crear, confirmar, reprogramar, cancelar, realizar };
}
