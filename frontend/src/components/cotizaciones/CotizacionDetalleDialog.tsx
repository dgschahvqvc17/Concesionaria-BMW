import { useEffect, useState } from 'react';
import { Check, Download, Loader2, Mail, X } from 'lucide-react';
import { toast } from 'sonner';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/api';
import { abrirCorreoCotizacion } from '@/lib/cotizacionEmail';
import { descargarCotizacionPdf } from '@/lib/cotizacionPdf';
import {
  DESCUENTO_MAXIMO,
  ESTADO_COTIZACION_LABELS,
  ESTADO_COTIZACION_STYLES,
  calcularImportes,
  puedeModificarse,
} from '@/lib/cotizaciones';
import { formatFecha, formatPrecio } from '@/lib/repuestos';
import type { Cotizacion, UpdateCotizacionInput } from '@/types/cotizacion';

interface CotizacionDetalleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cotizacion: Cotizacion | null;
  onSubmit: (input: UpdateCotizacionInput) => Promise<void>;
  loading?: boolean;
}

/** Detalle de una cotización: consulta, cambio de estado, PDF y correo (HU08). */
export function CotizacionDetalleDialog({
  open,
  onOpenChange,
  cotizacion,
  onSubmit,
  loading,
}: CotizacionDetalleDialogProps) {
  const [descuento, setDescuento] = useState('0');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    setDescuento(cotizacion ? String(cotizacion.descuentoPorcentaje) : '0');
    setObservaciones(cotizacion?.observaciones ?? '');
  }, [cotizacion?.cotizacionId, cotizacion?.descuentoPorcentaje, cotizacion?.observaciones, cotizacion?.updatedAt, cotizacion]);

  if (!cotizacion) return null;

  const modificable = puedeModificarse(cotizacion);
  const descuentoNum = Number(descuento);
  const descuentoValido = Number.isFinite(descuentoNum) && descuentoNum >= 0 && descuentoNum <= DESCUENTO_MAXIMO;
  const importes = calcularImportes(cotizacion.subtotal, descuentoValido ? descuentoNum : cotizacion.descuentoPorcentaje);

  const guardarCambios = async () => {
    try {
      await onSubmit({ descuentoPorcentaje: descuentoNum, observaciones });
      toast.success('Cotización actualizada correctamente.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const cambiarEstado = async (estado: 'aceptada' | 'rechazada') => {
    try {
      await onSubmit({ estado });
      toast.success(
        estado === 'aceptada' ? 'Cotización aceptada.' : 'Cotización rechazada.'
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const descargarPdf = () => {
    descargarCotizacionPdf(cotizacion);
    toast.success('PDF de la cotización generado.');
  };

  const enviarCorreo = () => {
    descargarCotizacionPdf(cotizacion);
    abrirCorreoCotizacion(cotizacion);
    toast.info('Se abrió tu cliente de correo. Adjunta el PDF descargado antes de enviar.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            {cotizacion.numero}
            <Badge className={ESTADO_COTIZACION_STYLES[cotizacion.estado]}>
              {ESTADO_COTIZACION_LABELS[cotizacion.estado]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Emitida el {formatFecha(cotizacion.createdAt)} · Vence el {formatFecha(cotizacion.fechaVencimiento)}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <div className="rounded-xl border border-border/60 p-4 text-sm">
            <p className="font-semibold">
              {cotizacion.cliente.nombres} {cotizacion.cliente.apellidos}
            </p>
            <p className="text-muted-foreground">Documento: {cotizacion.cliente.documento}</p>
            <p className="text-muted-foreground">Email: {cotizacion.cliente.email}</p>
            <p className="text-muted-foreground">Teléfono: {cotizacion.cliente.telefono}</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehículo</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead className="text-right">Precio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotizacion.items.map((item) => (
                <TableRow key={item.vehiculoId}>
                  <TableCell>
                    {item.marca} {item.modelo} {item.version}
                  </TableCell>
                  <TableCell>{item.anio}</TableCell>
                  <TableCell className="text-muted-foreground">{item.vin ?? '—'}</TableCell>
                  <TableCell className="text-right">{formatPrecio(item.precioUnitario)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrecio(cotizacion.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Descuento ({descuentoValido ? descuentoNum : cotizacion.descuentoPorcentaje}%)
              </span>
              <span>- {formatPrecio(importes.descuentoMonto)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border/60 pt-1 text-base font-semibold">
              <span>Total</span>
              <span>{formatPrecio(importes.total)}</span>
            </div>
          </div>

          {modificable ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="detalle-descuento">Descuento autorizado (%)</Label>
                <Input
                  id="detalle-descuento"
                  type="number"
                  min={0}
                  max={DESCUENTO_MAXIMO}
                  step="0.5"
                  value={descuento}
                  onChange={(event) => setDescuento(event.target.value)}
                />
                {!descuentoValido && (
                  <p className="text-xs text-destructive">Entre 0 y {DESCUENTO_MAXIMO}%.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="detalle-observaciones">Observaciones</Label>
                <Textarea
                  id="detalle-observaciones"
                  rows={3}
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={guardarCambios} disabled={loading || !descuentoValido}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  Guardar cambios
                </Button>
                <Button variant="outline" onClick={() => cambiarEstado('aceptada')} disabled={loading}>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Aceptar
                </Button>
                <Button variant="outline" onClick={() => cambiarEstado('rechazada')} disabled={loading}>
                  <X className="h-4 w-4" aria-hidden="true" />
                  Rechazar
                </Button>
              </div>
            </div>
          ) : (
            cotizacion.observaciones && (
              <div className="rounded-xl border border-border/60 p-4 text-sm">
                <p className="font-semibold">Observaciones</p>
                <p className="text-muted-foreground">{cotizacion.observaciones}</p>
              </div>
            )
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={descargarPdf}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Descargar PDF
          </Button>
          <Button onClick={enviarCorreo}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            Enviar por correo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
