import { useEffect, useState } from 'react';
import { BadgeCheck, CalendarClock, Loader2, XCircle } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/api';
import { formatFecha, formatPrecio } from '@/lib/repuestos';
import { ESTADO_RESERVA_LABELS, ESTADO_RESERVA_STYLES, puedeGestionarse } from '@/lib/reservas';
import type { CancelarReservaInput, ConvertirReservaInput, Reserva } from '@/types/reserva';

interface ReservaDetalleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reserva: Reserva | null;
  onCancelar: (input: CancelarReservaInput) => Promise<void>;
  onConvertir: (input: ConvertirReservaInput) => Promise<void>;
  loading?: boolean;
}

/** Detalle de una reserva: consulta, historial y acciones de gestión (HU09). */
export function ReservaDetalleDialog({
  open,
  onOpenChange,
  reserva,
  onCancelar,
  onConvertir,
  loading,
}: ReservaDetalleDialogProps) {
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    setMotivo('');
    setObservaciones('');
  }, [reserva?.reservaId, reserva?.estado]);

  if (!reserva) return null;

  const gestionable = puedeGestionarse(reserva);

  const cancelar = async () => {
    try {
      await onCancelar(motivo.trim() ? { motivo: motivo.trim() } : {});
      toast.success('Reserva cancelada y vehículo liberado.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const convertir = async () => {
    try {
      await onConvertir(observaciones.trim() ? { observaciones: observaciones.trim() } : {});
      toast.success('Reserva convertida en venta.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const historial = reserva.historial ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            {reserva.numero}
            <Badge className={ESTADO_RESERVA_STYLES[reserva.estado]}>
              {ESTADO_RESERVA_LABELS[reserva.estado]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Registrada el {formatFecha(reserva.createdAt)} · Vence el {formatFecha(reserva.fechaVencimiento)}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="mb-1 font-semibold">Cliente</p>
              <p>
                {reserva.cliente.nombres} {reserva.cliente.apellidos}
              </p>
              <p className="text-muted-foreground">Documento: {reserva.cliente.documento}</p>
              <p className="text-muted-foreground">Email: {reserva.cliente.email}</p>
              <p className="text-muted-foreground">Teléfono: {reserva.cliente.telefono}</p>
            </div>

            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="mb-1 flex items-center gap-2 font-semibold">
                <CalendarClock className="h-4 w-4 text-brand-blue" aria-hidden="true" />
                Vehículo
              </p>
              <p>
                {reserva.vehiculo.marca} {reserva.vehiculo.modelo} {reserva.vehiculo.version}
              </p>
              <p className="text-muted-foreground">Año: {reserva.vehiculo.anio}</p>
              <p className="text-muted-foreground">VIN: {reserva.vehiculo.vin ?? '—'}</p>
              <p className="text-muted-foreground">Precio: {formatPrecio(reserva.vehiculo.precio)}</p>
            </div>
          </div>

          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-4">
              <p className="font-semibold">Monto de la reserva</p>
              <p className="text-muted-foreground">
                {reserva.monto != null ? formatPrecio(reserva.monto) : 'No especificado'}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <p className="font-semibold">Vigencia</p>
              <p className="text-muted-foreground">{reserva.vigenciaDias ? `${reserva.vigenciaDias} días` : '—'}</p>
            </div>
          </div>

          {reserva.condiciones && (
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="font-semibold">Condiciones</p>
              <p className="text-muted-foreground">{reserva.condiciones}</p>
            </div>
          )}

          {reserva.observaciones && (
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="font-semibold">Observaciones de la venta</p>
              <p className="text-muted-foreground">{reserva.observaciones}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold">Historial de estados</p>
            <ul className="space-y-2">
              {historial.map((entrada, index) => (
                <li
                  key={`${entrada.estado}-${index}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 p-2 text-sm"
                >
                  <Badge className={ESTADO_RESERVA_STYLES[entrada.estado]}>
                    {ESTADO_RESERVA_LABELS[entrada.estado]}
                  </Badge>
                  <span className="text-muted-foreground">{formatFecha(entrada.fecha)}</span>
                  {entrada.usuario && <span className="text-muted-foreground">· {entrada.usuario}</span>}
                  {entrada.motivo && <span className="text-muted-foreground">· {entrada.motivo}</span>}
                </li>
              ))}
              {historial.length === 0 && <li className="text-sm text-muted-foreground">Sin historial.</li>}
            </ul>
          </div>

          {gestionable && (
            <div className="space-y-4 rounded-xl border border-border/60 p-4">
              <div className="space-y-2">
                <Label htmlFor="reserva-observaciones">Observaciones de la venta</Label>
                <Textarea
                  id="reserva-observaciones"
                  rows={2}
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                  placeholder="Datos de la venta (opcional)."
                />
                <Button onClick={convertir} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  Convertir en venta
                </Button>
              </div>

              <div className="space-y-2 border-t border-border/60 pt-4">
                <Label htmlFor="reserva-motivo">Motivo de cancelación</Label>
                <Textarea
                  id="reserva-motivo"
                  rows={2}
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Motivo por el que se cancela la reserva (opcional)."
                />
                <Button variant="outline" onClick={cancelar} disabled={loading}>
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  Cancelar reserva
                </Button>
              </div>
            </div>
          )}
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
