import { useMemo, useState } from 'react';
import { Car, Loader2 } from 'lucide-react';

import {
  CatalogoFiltros,
} from '@/components/catalog/CatalogoFiltros';
import { CatalogoCard } from '@/components/catalog/CatalogoCard';
import { MStripe } from '@/components/brand/MStripe';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useCatalogo } from '@/hooks/useCatalogo';
import { FILTROS_CATALOGO_VACIOS, filtrarCatalogo, type CatalogoFiltros as CatalogoFiltrosState } from '@/lib/catalogo';

/** Catálogo web público de vehículos (HU05). */
export function CatalogoPage() {
  const { vehiculos, loading, error, recargar } = useCatalogo();
  const [filtros, setFiltros] = useState<CatalogoFiltrosState>(FILTROS_CATALOGO_VACIOS);

  const filtrados = useMemo(() => filtrarCatalogo(vehiculos, filtros), [vehiculos, filtros]);

  return (
    <div className="space-y-8">
      <section className="relative animate-slide-up overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue-night via-brand-blue-deep to-brand-blue-dark p-7 text-white shadow-panel sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-sidebar-grid bg-grid opacity-30" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-1 bg-m-gradient" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-brand-blue/40 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55">
            <MStripe className="h-3.5 w-8" />
            Concesionaria BMW
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Catálogo de vehículos</h1>
          <p className="text-sm leading-relaxed text-white/70">
            Explora los vehículos nuevos y seminuevos disponibles: revisa sus fotografías, precios,
            características y disponibilidad antes de contactar a un vendedor.
          </p>
        </div>
      </section>

      <CatalogoFiltros filters={filtros} onChange={setFiltros} />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Cargando catálogo…
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el catálogo</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            {error}
            <Button variant="outline" size="sm" onClick={() => void recargar()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : filtrados.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
          <Car className="h-8 w-8" aria-hidden="true" />
          {vehiculos.length === 0
            ? 'Aún no hay vehículos publicados en el catálogo.'
            : 'No hay vehículos que coincidan con los filtros.'}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {filtrados.length} {filtrados.length === 1 ? 'vehículo' : 'vehículos'} disponibles
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((vehiculo) => (
              <CatalogoCard key={vehiculo.vehiculoId} vehiculo={vehiculo} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CatalogoPage;
