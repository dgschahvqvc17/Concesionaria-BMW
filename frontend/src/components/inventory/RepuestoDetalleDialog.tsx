import { Loader2 } from 'lucide-react';

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
import { formatFecha, formatPrecio } from '@/lib/repuestos';
import type { Repuesto } from '@/types/repuesto';

interface RepuestoDetalleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repuesto: Repuesto | null;
  loading: boolean;
}

/** Detalle de solo lectura de un repuesto del inventario (HU04). */
export function RepuestoDetalleDialog({
  open,
  onOpenChange,
  repuesto,
  loading,
}: RepuestoDetalleDialogProps) {
  if (!repuesto && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            {repuesto?.codigo ?? 'Repuesto'}
            {repuesto &&
              (repuesto.requiereReposicion ? (
                <Badge className="border-transparent bg-amber-500/10 text-amber-700">
                  Reposición
                </Badge>
              ) : (
                <Badge variant="secondary">Disponible</Badge>
              ))}
          </DialogTitle>
          <DialogDescription>{repuesto?.nombre ?? 'Cargando repuesto…'}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando detalle…
          </div>
        ) : (
          repuesto && (
            <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Categoría
                  </p>
                  <div className="mt-2">
                    {repuesto.categoria ? (
                      <Badge variant="secondary">{repuesto.categoria}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Sin categoría</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Precio unitario
                  </p>
                  <p className="mt-2 text-lg font-semibold">{formatPrecio(repuesto.precio)}</p>
                </div>

                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Existencias
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {repuesto.cantidad}{' '}
                    <span className="text-sm font-normal text-muted-foreground">
                      / mín. {repuesto.cantidadMinima}
                    </span>
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Última actualización
                  </p>
                  <p className="mt-2 font-medium">{formatFecha(repuesto.updatedAt)}</p>
                </div>
              </div>

              {repuesto.descripcion && (
                <div className="rounded-xl border border-border/60 p-4 text-sm">
                  <p className="font-semibold">Descripción</p>
                  <p className="mt-1 text-muted-foreground">{repuesto.descripcion}</p>
                </div>
              )}
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
