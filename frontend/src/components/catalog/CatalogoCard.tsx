import { Link } from 'react-router-dom';
import { Gauge, ImageOff } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  CONDICION_LABELS,
  ESTADO_LABELS,
  ESTADO_STYLES_FOTO,
  TIPO_LABELS,
  formatKilometraje,
  formatPrecio,
} from '@/lib/vehiculos';
import type { CatalogoVehiculo } from '@/types/catalogo';

interface CatalogoCardProps {
  vehiculo: CatalogoVehiculo;
}

/** Tarjeta de un vehículo publicado en el catálogo web (HU05). */
export function CatalogoCard({ vehiculo }: CatalogoCardProps) {
  const portada = vehiculo.fotos[0]?.url;

  return (
    <Link
      to={`/catalogo/${vehiculo.vehiculoId}`}
      className="group surface-card flex animate-fade-in flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {portada ? (
          <img
            src={portada}
            alt={`${vehiculo.marca} ${vehiculo.modelo}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge className={ESTADO_STYLES_FOTO[vehiculo.estado]}>{ESTADO_LABELS[vehiculo.estado]}</Badge>
          <Badge className="border-transparent bg-white/85 text-foreground backdrop-blur">
            {CONDICION_LABELS[vehiculo.condicion]}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {vehiculo.marca} · {TIPO_LABELS[vehiculo.tipo]}
          </p>
          <h3 className="text-lg font-semibold tracking-tight">
            {vehiculo.modelo} {vehiculo.anio}
          </h3>
          <p className="line-clamp-1 text-sm text-muted-foreground">{vehiculo.version}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
            {formatKilometraje(vehiculo.kilometraje)}
          </span>
          <span className="text-lg font-semibold text-brand-blue-deep">{formatPrecio(vehiculo.precio)}</span>
        </div>
      </div>
    </Link>
  );
}
