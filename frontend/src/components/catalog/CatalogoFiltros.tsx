import { Search, SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FILTROS_CATALOGO_VACIOS, type CatalogoFiltros as CatalogoFiltrosState } from '@/lib/catalogo';
import { CONDICIONES, CONDICION_LABELS, TIPOS, TIPO_LABELS } from '@/lib/vehiculos';
import type { CondicionVehiculo, TipoVehiculo } from '@/types/vehiculo';

interface CatalogoFiltrosProps {
  filters: CatalogoFiltrosState;
  onChange: (filters: CatalogoFiltrosState) => void;
}

const TODOS = '__todos__';

/** Panel de búsqueda y filtros del catálogo público (HU05). */
export function CatalogoFiltros({ filters, onChange }: CatalogoFiltrosProps) {
  const set = <K extends keyof CatalogoFiltrosState>(key: K, value: CatalogoFiltrosState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="surface-card grid animate-fade-in gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-4">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Filtros
        </span>
      </div>

      <div className="space-y-2 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="catalogo-q">Buscar</Label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="catalogo-q"
            className="pl-9"
            placeholder="Buscar por modelo, versión o palabra clave"
            value={filters.q}
            onChange={(event) => set('q', event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="catalogo-tipo">Tipo</Label>
        <Select
          value={filters.tipo || TODOS}
          onValueChange={(value) => set('tipo', value === TODOS ? '' : (value as TipoVehiculo))}
        >
          <SelectTrigger id="catalogo-tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los tipos</SelectItem>
            {TIPOS.map((tipo) => (
              <SelectItem key={tipo} value={tipo}>
                {TIPO_LABELS[tipo]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="catalogo-condicion">Condición</Label>
        <Select
          value={filters.condicion || TODOS}
          onValueChange={(value) =>
            set('condicion', value === TODOS ? '' : (value as CondicionVehiculo))
          }
        >
          <SelectTrigger id="catalogo-condicion">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas</SelectItem>
            {CONDICIONES.map((condicion) => (
              <SelectItem key={condicion} value={condicion}>
                {CONDICION_LABELS[condicion]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Año</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Desde"
            value={filters.anioDesde}
            onChange={(event) => set('anioDesde', event.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Hasta"
            value={filters.anioHasta}
            onChange={(event) => set('anioHasta', event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Precio</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Mín."
            value={filters.precioMin}
            onChange={(event) => set('precioMin', event.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Máx."
            value={filters.precioMax}
            onChange={(event) => set('precioMax', event.target.value)}
          />
        </div>
      </div>

      <div className="flex items-end sm:col-span-2 lg:col-span-4">
        <Button variant="ghost" size="sm" onClick={() => onChange(FILTROS_CATALOGO_VACIOS)}>
          <X className="h-4 w-4" aria-hidden="true" />
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
}
