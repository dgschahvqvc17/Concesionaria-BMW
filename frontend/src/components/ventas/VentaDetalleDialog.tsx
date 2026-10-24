import { BadgeCheck, CalendarClock, Download, ReceiptText } from 'lucide-react';

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
import { NotificacionesRecurso } from '@/components/notificaciones/NotificacionesRecurso';
import { descargarVentaPdf } from '@/lib/ventaPdf';
import { formatFecha, formatPrecio } from '@/lib/repuestos';
import type { Venta } from '@/types/venta';

interface VentaDetalleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venta: Venta | null;
}

/** Detalle de una operación de venta y generación del comprobante (HU10). */
export function VentaDetalleDialog({ open, onOpenChange, venta }: VentaDetalleDialogProps) {
  if (!venta) return null;

  const descargar = () => {
    descargarVentaPdf(venta);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            {venta.numero}
            <Badge className="border-transparent bg-emerald-500/10 text-emerald-700">Completada</Badge>
          </DialogTitle>
          <DialogDescription>
            Venta registrada el {formatFecha(venta.fechaVenta)} por {venta.createdByName ?? '—'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="mb-1 font-semibold">Cliente</p>
              <p>
                {venta.cliente.nombres} {venta.cliente.apellidos}
              </p>
              <p className="text-muted-foreground">Documento: {venta.cliente.documento}</p>
              <p className="text-muted-foreground">Email: {venta.cliente.email}</p>
              <p className="text-muted-foreground">Teléfono: {venta.cliente.telefono}</p>
            </div>

            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="mb-1 flex items-center gap-2 font-semibold">
                <CalendarClock className="h-4 w-4 text-brand-blue" aria-hidden="true" />
                Vehículo
              </p>
              <p>
                {venta.vehiculo.marca} {venta.vehiculo.modelo} {venta.vehiculo.version}
              </p>
              <p className="text-muted-foreground">Año: {venta.vehiculo.anio}</p>
              <p className="text-muted-foreground">VIN: {venta.vehiculo.vin ?? '—'}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 p-4 text-sm">
            <p className="mb-3 font-semibold">Importes</p>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Precio de lista</span>
              <span className="font-medium">{formatPrecio(venta.precioLista)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Descuento ({venta.descuentoPorcentaje}%)</span>
              <span className="font-medium">- {formatPrecio(venta.descuentoMonto)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-base">
              <span className="font-semibold">Precio final</span>
              <span className="font-semibold">{formatPrecio(venta.precioFinal)}</span>
            </div>
          </div>

          {venta.numeroReserva && (
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-4 text-sm">
              <BadgeCheck className="h-5 w-5 shrink-0 text-brand-blue" aria-hidden="true" />
              <span>
                <span className="block font-medium">Convertida desde la reserva {venta.numeroReserva}</span>
                <span className="text-muted-foreground">
                  La unidad estaba apartada para este cliente y la reserva quedó cerrada.
                </span>
              </span>
            </div>
          )}

          {venta.observaciones && (
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="font-semibold">Observaciones</p>
              <p className="text-muted-foreground">{venta.observaciones}</p>
            </div>
          )}

          <div className="rounded-xl border border-border/60 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <ReceiptText className="h-4 w-4 text-brand-blue" aria-hidden="true" />
              Comprobante
            </p>
            <p className="mt-1 text-muted-foreground">
              Genera un PDF con el resumen de la operación para entregarlo al cliente.
            </p>
            <Button className="mt-3" size="sm" onClick={descargar}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Descargar comprobante
            </Button>
          </div>

          <NotificacionesRecurso recursoId={venta.ventaId} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
