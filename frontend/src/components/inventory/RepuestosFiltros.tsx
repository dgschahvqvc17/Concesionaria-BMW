import { Search, SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface RepuestosFilters {
  q: string;
  soloReposicion: boolean;
}

export const FILTROS_VACIOS: RepuestosFilters = {
  q: '',
  soloReposicion: false,
};

interface RepuestosFiltrosProps {
  filters: RepuestosFilters;
  onChange: (filters: RepuestosFilters) => void;
}

/** Panel de búsqueda y filtros del inventario de repuestos. */
export function RepuestosFiltros({ filters, onChange }: RepuestosFiltrosProps) {
  return (
    <div className="surface-card grid animate-fade-in gap-4 p-4 sm:grid-cols-2">
      <div className="flex items-center gap-2 sm:col-span-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Filtros
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filtro-repuesto">Buscar</Label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="filtro-repuesto"
            className="pl-9"
            placeholder="Buscar por código o nombre"
            value={filters.q}
            onChange={(event) => onChange({ ...filters, q: event.target.value })}
          />
        </div>
      </div>

      <div className="flex items-end">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
            checked={filters.soloReposicion}
            onChange={(event) => onChange({ ...filters, soloReposicion: event.target.checked })}
          />
          Mostrar solo los que requieren reposición
        </label>
      </div>

      <div className="sm:col-span-2">
        <Button variant="ghost" size="sm" onClick={() => onChange(FILTROS_VACIOS)}>
          <X className="h-4 w-4" aria-hidden="true" />
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
}
