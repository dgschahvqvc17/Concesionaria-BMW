import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { catalogoService } from '@/services/catalogo';
import type { CatalogoVehiculo } from '@/types/catalogo';

/** Carga la lista pública de vehículos publicados en el catálogo web (HU05). */
export function useCatalogo() {
  const [vehiculos, setVehiculos] = useState<CatalogoVehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { vehiculos: lista } = await catalogoService.list();
      setVehiculos(lista);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { vehiculos, loading, error, recargar: cargar };
}

/** Carga el detalle público de un vehículo del catálogo (HU05). */
export function useCatalogoVehiculo(vehiculoId?: string) {
  const [vehiculo, setVehiculo] = useState<CatalogoVehiculo | null>(null);
  const [loading, setLoading] = useState(Boolean(vehiculoId));
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!vehiculoId) return;
    setLoading(true);
    setError(null);
    try {
      const { vehiculo: encontrado } = await catalogoService.get(vehiculoId);
      setVehiculo(encontrado);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [vehiculoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { vehiculo, loading, error, recargar: cargar };
}
