import { FileText, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CONDICION_LABELS,
  ESTADO_LABELS,
  ESTADO_STYLES,
  NIVEL_STOCK_LABELS,
  NIVEL_STOCK_STYLES,
  TIPO_LABELS,
  formatFecha,
  formatKilometraje,
  formatPrecio,
  formatStock,
  nivelStock,
} from '@/lib/vehiculos';
import type { Vehiculo } from '@/types/vehiculo';

interface VehiculoDetalleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculo: Vehiculo | null;
  loading: boolean;
}

/** Detalle de solo lectura de un vehículo del inventario (HU03). */
export function VehiculoDetalleDialog({
  open,
  onOpenChange,
  vehiculo,
  loading,
}: VehiculoDetalleDialogProps) {
  if (!vehiculo && !loading) return null;

  const nivel = vehiculo ? nivelStock(vehiculo.stock) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : 'Vehículo'}
            {vehiculo && (
              <Badge className={ESTADO_STYLES[vehiculo.estado]}>
                {ESTADO_LABELS[vehiculo.estado]}
              </Badge>
            )}
            {vehiculo && nivel && (
              <Badge className={NIVEL_STOCK_STYLES[nivel]}>{NIVEL_STOCK_LABELS[nivel]}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {vehiculo ? `${vehiculo.version} · ${vehiculo.anio}` : 'Cargando vehículo…'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando detalle…
          </div>
        ) : (
          vehiculo && (
            <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Stock disponible
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {formatStock(vehiculo.stock)}{' '}
                    <span className="text-sm font-normal text-muted-foreground">
                      {nivel ? NIVEL_STOCK_LABELS[nivel] : ''}
                    </span>
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Precio
                  </p>
                  <p className="mt-2 text-lg font-semibold">{formatPrecio(vehiculo.precio)}</p>
                </div>

                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Kilometraje
                  </p>
                  <p className="mt-2 text-lg font-semibold">{formatKilometraje(vehiculo.kilometraje)}</p>
                </div>

                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Condición
                  </p>
                  <p className="mt-2 font-medium">{CONDICION_LABELS[vehiculo.condicion]}</p>
                </div>

                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Tipo
                  </p>
                  <p className="mt-2 font-medium">{TIPO_LABELS[vehiculo.tipo]}</p>
                </div>

                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Color
                  </p>
                  <p className="mt-2 font-medium">{vehiculo.color}</p>
                </div>

                <div className="rounded-xl border border-border/60 p-4 text-sm sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    VIN
                  </p>
                  <p className="mt-2 font-mono text-sm">{vehiculo.vin}</p>
                </div>

                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Catálogo web
                  </p>
                  <p className="mt-2 font-medium">
                    {vehiculo.publicado === false ? 'No publicado' : 'Publicado'}
                  </p>
                </div>
              </div>

              {vehiculo.descripcion && (
                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="font-semibold">Descripción</p>
                  <p className="mt-1 text-muted-foreground">{vehiculo.descripcion}</p>
                </div>
              )}

              {vehiculo.caracteristicas && vehiculo.caracteristicas.length > 0 && (
                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="font-semibold">Características</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {vehiculo.caracteristicas.map((caracteristica) => (
                      <Badge key={caracteristica} variant="secondary">
                        {caracteristica}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {vehiculo.fotos.length > 0 && (
                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="font-semibold">Fotografías</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {vehiculo.fotos.map((foto) => (
                      <img
                        key={foto.key}
                        src={foto.url}
                        alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                        className="h-28 w-full rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {vehiculo.documentos && vehiculo.documentos.length > 0 && (
                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="font-semibold">Documentos</p>
                  <ul className="mt-2 space-y-2">
                    {vehiculo.documentos.map((documento) => (
                      <li key={documento.key} className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        {documento.url ? (
                          <a
                            href={documento.url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2 hover:text-foreground"
                          >
                            {documento.nombre}
                          </a>
                        ) : (
                          <span>{documento.nombre}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Registrado: {formatFecha(vehiculo.createdAt)} · Última actualización:{' '}
                {formatFecha(vehiculo.updatedAt)}
              </p>
            </div>
          )
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
