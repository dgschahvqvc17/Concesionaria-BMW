import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { vehiculosService } from '@/services/vehiculos';
import type {
  CreateVehiculoInput,
  EstadoVehiculo,
  UpdateVehiculoInput,
  Vehiculo,
} from '@/types/vehiculo';

function ordenar(vehiculos: Vehiculo[]): Vehiculo[] {
  return [...vehiculos].sort((a, b) =>
    String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  );
}

/** Hook que encapsula la carga y mutación del inventario de vehículos (HU03). */
export function useVehiculos() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { vehiculos: lista } = await vehiculosService.list();
      setVehiculos(ordenar(lista));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const crear = useCallback(async (input: CreateVehiculoInput): Promise<Vehiculo> => {
    const { vehiculo } = await vehiculosService.create(input);
    setVehiculos((prev) => ordenar([vehiculo, ...prev]));
    return vehiculo;
  }, []);

  const actualizar = useCallback(
    async (vehiculoId: string, input: UpdateVehiculoInput): Promise<Vehiculo> => {
      const { vehiculo } = await vehiculosService.update(vehiculoId, input);
      setVehiculos((prev) => ordenar(prev.map((v) => (v.vehiculoId === vehiculoId ? vehiculo : v))));
      return vehiculo;
    },
    []
  );

  const cambiarEstado = useCallback(
    async (vehiculoId: string, estado: EstadoVehiculo): Promise<Vehiculo> => {
      const { vehiculo } = await vehiculosService.update(vehiculoId, { estado });
      setVehiculos((prev) => prev.map((v) => (v.vehiculoId === vehiculoId ? vehiculo : v)));
      return vehiculo;
    },
    []
  );

  /** Consulta el detalle actualizado de un vehículo desde `GET /api/vehiculos/:id`. */
  const obtener = useCallback(async (vehiculoId: string): Promise<Vehiculo> => {
    const { vehiculo } = await vehiculosService.get(vehiculoId);
    return vehiculo;
  }, []);

  return { vehiculos, loading, error, recargar, crear, actualizar, cambiarEstado, obtener };
}
