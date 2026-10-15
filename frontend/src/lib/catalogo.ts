import type { CondicionVehiculo, TipoVehiculo } from '@/types/vehiculo';
import type { CatalogoVehiculo } from '@/types/catalogo';

/** Estado de los filtros del catálogo público (HU05). */
export interface CatalogoFiltros {
  q: string;
  tipo: '' | TipoVehiculo;
  condicion: '' | CondicionVehiculo;
  anioDesde: string;
  anioHasta: string;
  precioMin: string;
  precioMax: string;
}

export const FILTROS_CATALOGO_VACIOS: CatalogoFiltros = {
  q: '',
  tipo: '',
  condicion: '',
  anioDesde: '',
  anioHasta: '',
  precioMin: '',
  precioMax: '',
};

function aNumero(valor: string): number | undefined {
  return valor.trim() === '' ? undefined : Number(valor);
}

/** Filtra los vehículos del catálogo por palabra clave, tipo, condición, año y precio. */
export function filtrarCatalogo(
  vehiculos: CatalogoVehiculo[],
  filtros: CatalogoFiltros
): CatalogoVehiculo[] {
  const q = filtros.q.trim().toLowerCase();
  const anioDesde = aNumero(filtros.anioDesde);
  const anioHasta = aNumero(filtros.anioHasta);
  const precioMin = aNumero(filtros.precioMin);
  const precioMax = aNumero(filtros.precioMax);

  return vehiculos.filter((vehiculo) => {
    if (q) {
      const texto = `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.version} ${vehiculo.descripcion}`.toLowerCase();
      if (!texto.includes(q)) return false;
    }
    if (filtros.tipo && vehiculo.tipo !== filtros.tipo) return false;
    if (filtros.condicion && vehiculo.condicion !== filtros.condicion) return false;
    if (anioDesde !== undefined && vehiculo.anio < anioDesde) return false;
    if (anioHasta !== undefined && vehiculo.anio > anioHasta) return false;
    if (precioMin !== undefined && vehiculo.precio < precioMin) return false;
    if (precioMax !== undefined && vehiculo.precio > precioMax) return false;
    return true;
  });
}
