import { useEffect, useState } from 'react';
import { BadgeCheck, CalendarClock, Check, Loader2, XCircle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { NotificacionesRecurso } from '@/components/notificaciones/NotificacionesRecurso';
import { getErrorMessage } from '@/lib/api';
import {
  DURACION_DEFECTO,
  DURACION_MAX,
  DURACION_MIN,
  ESTADO_PRUEBA_LABELS,
  ESTADO_PRUEBA_STYLES,
  ORIGEN_PRUEBA_LABELS,
  PASO_MINUTOS,
  aValorLocal,
  formatFechaHora,
  puedeCancelarse,
  puedeConfirmarse,
  puedeRealizarse,
  puedeReprogramarse,
  rangoHorario,
  validarFechaPrueba,
} from '@/lib/pruebasManejo';
import { formatPrecio } from '@/lib/repuestos';
import type {
  CancelarPruebaInput,
  ConfirmarPruebaInput,
  PruebaManejo,
  RealizarPruebaInput,
  ReprogramarPruebaInput,
} from '@/types/pruebaManejo';

interface PruebaManejoDetalleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prueba: PruebaManejo | null;
  onConfirmar: (input: ConfirmarPruebaInput) => Promise<void>;
  onReprogramar: (input: ReprogramarPruebaInput) => Promise<void>;
  onCancelar: (input: CancelarPruebaInput) => Promise<void>;
  onRealizar: (input: RealizarPruebaInput) => Promise<void>;
  loading?: boolean;
}

/** Detalle de una prueba de manejo: datos, historial y acciones de gestión (HU11). */
export function PruebaManejoDetalleDialog({
  open,
  onOpenChange,
  prueba,
  onConfirmar,
  onReprogramar,
  onCancelar,
  onRealizar,
  loading,
}: PruebaManejoDetalleDialogProps) {
  const [observaciones, setObservaciones] = useState('');
  const [motivo, setMotivo] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [duracion, setDuracion] = useState(DURACION_DEFECTO);
  const [errorFecha, setErrorFecha] = useState<string | null>(null);

  useEffect(() => {
    setObservaciones('');
    setMotivo('');
    setErrorFecha(null);
    if (prueba) {
      setFechaHora(aValorLocal(prueba.fechaHora));
      setDuracion(prueba.duracionMinutos);
    }
  }, [prueba?.pruebaId, prueba?.estado, prueba?.fechaHora, prueba?.duracionMinutos, prueba]);

  if (!prueba) return null;

  const historial = prueba.historial ?? [];

  const confirmar = async () => {
    try {
      await onConfirmar(observaciones.trim() ? { observaciones: observaciones.trim() } : {});
      toast.success('Prueba confirmada.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const realizar = async () => {
    try {
      await onRealizar(observaciones.trim() ? { observaciones: observaciones.trim() } : {});
      toast.success('Prueba marcada como realizada.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const cancelar = async () => {
    try {
      await onCancelar(motivo.trim() ? { motivo: motivo.trim() } : {});
      toast.success('Prueba cancelada.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const reprogramar = async () => {
    const error = validarFechaPrueba(fechaHora);
    if (error) {
      setErrorFecha(error);
      return;
    }
    setErrorFecha(null);
    try {
      await onReprogramar({
        fechaHora: new Date(fechaHora).toISOString(),
        duracionMinutos: duracion,
      });
      toast.success('Prueba reprogramada.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            {prueba.numero}
            <Badge className={ESTADO_PRUEBA_STYLES[prueba.estado]}>
              {ESTADO_PRUEBA_LABELS[prueba.estado]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Solicitada el {prueba.createdAt ? formatFechaHora(prueba.createdAt) : '—'} · Origen:{' '}
            {ORIGEN_PRUEBA_LABELS[prueba.origen]}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="mb-1 font-semibold">Solicitante</p>
              <p>{prueba.contacto.nombre}</p>
              <p className="text-muted-foreground">Teléfono: {prueba.contacto.telefono}</p>
              {prueba.contacto.email && <p className="text-muted-foreground">Email: {prueba.contacto.email}</p>}
              {prueba.cliente && (
                <p className="text-muted-foreground">
                  Cliente: {prueba.cliente.nombres} {prueba.cliente.apellidos}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="mb-1 flex items-center gap-2 font-semibold">
                <CalendarClock className="h-4 w-4 text-brand-blue" aria-hidden="true" />
                Vehículo
              </p>
              <p>
                {prueba.vehiculo.marca} {prueba.vehiculo.modelo} {prueba.vehiculo.version}
              </p>
              <p className="text-muted-foreground">Año: {prueba.vehiculo.anio}</p>
              <p className="text-muted-foreground">Precio: {formatPrecio(prueba.vehiculo.precio)}</p>
            </div>
          </div>

          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-4">
              <p className="font-semibold">Fecha y hora</p>
              <p className="text-muted-foreground">
                {formatFechaHora(prueba.fechaHora)} · {rangoHorario(prueba)} · {prueba.duracionMinutos} min
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <p className="font-semibold">Registrada por</p>
              <p className="text-muted-foreground">{prueba.createdByName ?? 'Solicitud pública'}</p>
            </div>
          </div>

          {prueba.observaciones && (
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="font-semibold">Observaciones</p>
              <p className="text-muted-foreground">{prueba.observaciones}</p>
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
                  <Badge className={ESTADO_PRUEBA_STYLES[entrada.estado]}>
                    {ESTADO_PRUEBA_LABELS[entrada.estado]}
                  </Badge>
                  <span className="text-muted-foreground">{formatFechaHora(entrada.fecha)}</span>
                  {entrada.usuario && <span className="text-muted-foreground">· {entrada.usuario}</span>}
                  {entrada.motivo && <span className="text-muted-foreground">· {entrada.motivo}</span>}
                  {entrada.observaciones && (
                    <span className="text-muted-foreground">· {entrada.observaciones}</span>
                  )}
                </li>
              ))}
              {historial.length === 0 && <li className="text-sm text-muted-foreground">Sin historial.</li>}
            </ul>
          </div>

          <NotificacionesRecurso recursoId={prueba.pruebaId} />

          {(puedeConfirmarse(prueba) || puedeRealizarse(prueba)) && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <div className="space-y-2">
                <Label htmlFor="prueba-observaciones">Observaciones</Label>
                <Textarea
                  id="prueba-observaciones"
                  rows={2}
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                  placeholder="Notas de la gestión (opcional)."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {puedeConfirmarse(prueba) && (
                  <Button onClick={confirmar} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    Confirmar asistencia
                  </Button>
                )}
                {puedeRealizarse(prueba) && (
                  <Button onClick={realizar} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Marcar como realizada
                  </Button>
                )}
              </div>
            </div>
          )}

          {puedeReprogramarse(prueba) && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <p className="text-sm font-semibold">Reprogramar</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prueba-reprogramar-fecha">Nueva fecha y hora</Label>
                  <Input
                    id="prueba-reprogramar-fecha"
                    type="datetime-local"
                    step={PASO_MINUTOS * 60}
                    value={fechaHora}
                    onChange={(event) => setFechaHora(event.target.value)}
                  />
                  {errorFecha && <p className="text-xs text-destructive">{errorFecha}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prueba-reprogramar-duracion">Duración (minutos)</Label>
                  <Input
                    id="prueba-reprogramar-duracion"
                    type="number"
                    min={DURACION_MIN}
                    max={DURACION_MAX}
                    step={15}
                    value={duracion}
                    onChange={(event) => setDuracion(Number(event.target.value))}
                  />
                </div>
              </div>
              <Button variant="outline" onClick={reprogramar} disabled={loading}>
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                Reprogramar
              </Button>
            </div>
          )}

          {puedeCancelarse(prueba) && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <div className="space-y-2">
                <Label htmlFor="prueba-motivo">Motivo de cancelación</Label>
                <Textarea
                  id="prueba-motivo"
                  rows={2}
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Motivo por el que se cancela la prueba (opcional)."
                />
              </div>
              <Button variant="outline" onClick={cancelar} disabled={loading}>
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Cancelar prueba
              </Button>
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
