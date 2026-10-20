import { useEffect, useState } from 'react';
import { BadgeCheck, CalendarClock, Check, Loader2, Play, Wrench, XCircle } from 'lucide-react';
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
  ESTADO_CITA_LABELS,
  ESTADO_CITA_STYLES,
  PASO_MINUTOS,
  TIPO_SERVICIO_LABELS,
  aValorLocal,
  formatFechaHora,
  puedeCancelarse,
  puedeConfirmarse,
  puedeFinalizarse,
  puedeIniciarse,
  puedeReprogramarse,
  rangoHorario,
  validarFechaCita,
} from '@/lib/citasTaller';
import { formatPrecio } from '@/lib/repuestos';
import type {
  CancelarCitaInput,
  CitaTaller,
  EstadoCitaInput,
  ReprogramarCitaInput,
} from '@/types/citaTaller';

interface CitaTallerDetalleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cita: CitaTaller | null;
  onConfirmar: (input: EstadoCitaInput) => Promise<void>;
  onReprogramar: (input: ReprogramarCitaInput) => Promise<void>;
  onIniciar: (input: EstadoCitaInput) => Promise<void>;
  onFinalizar: (input: EstadoCitaInput) => Promise<void>;
  onCancelar: (input: CancelarCitaInput) => Promise<void>;
  loading?: boolean;
}

/** Detalle de una cita del taller: datos, historial y acciones de gestión (HU13). */
export function CitaTallerDetalleDialog({
  open,
  onOpenChange,
  cita,
  onConfirmar,
  onReprogramar,
  onIniciar,
  onFinalizar,
  onCancelar,
  loading,
}: CitaTallerDetalleDialogProps) {
  const [observaciones, setObservaciones] = useState('');
  const [motivo, setMotivo] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [duracion, setDuracion] = useState(DURACION_DEFECTO);
  const [errorFecha, setErrorFecha] = useState<string | null>(null);

  useEffect(() => {
    setObservaciones('');
    setMotivo('');
    setErrorFecha(null);
    if (cita) {
      setFechaHora(aValorLocal(cita.fechaHora));
      setDuracion(cita.duracionMinutos);
    }
  }, [cita?.citaId, cita?.estado, cita?.fechaHora, cita?.duracionMinutos, cita]);

  if (!cita) return null;

  const historial = cita.historial ?? [];

  const ejecutar = async (accion: () => Promise<void>, mensaje: string) => {
    try {
      await accion();
      toast.success(mensaje);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const confirmar = () =>
    ejecutar(
      () => onConfirmar(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
      'Cita confirmada.'
    );

  const iniciar = () =>
    ejecutar(
      () => onIniciar(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
      'Atención de la cita iniciada.'
    );

  const finalizar = () =>
    ejecutar(
      () => onFinalizar(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
      'Cita finalizada.'
    );

  const cancelar = () =>
    ejecutar(() => onCancelar(motivo.trim() ? { motivo: motivo.trim() } : {}), 'Cita cancelada.');

  const reprogramar = async () => {
    const error = validarFechaCita(fechaHora);
    if (error) {
      setErrorFecha(error);
      return;
    }
    setErrorFecha(null);
    await ejecutar(
      () =>
        onReprogramar({
          fechaHora: new Date(fechaHora).toISOString(),
          duracionMinutos: duracion,
        }),
      'Cita reprogramada.'
    );
  };

  const gestionaEstados = puedeConfirmarse(cita) || puedeIniciarse(cita) || puedeFinalizarse(cita);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            {cita.numero}
            <Badge className={ESTADO_CITA_STYLES[cita.estado]}>{ESTADO_CITA_LABELS[cita.estado]}</Badge>
          </DialogTitle>
          <DialogDescription>
            Registrada el {cita.createdAt ? formatFechaHora(cita.createdAt) : '—'} · Servicio:{' '}
            {TIPO_SERVICIO_LABELS[cita.tipoServicio]}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="mb-1 font-semibold">Cliente</p>
              {cita.cliente ? (
                <>
                  <p>
                    {cita.cliente.nombres} {cita.cliente.apellidos}
                  </p>
                  <p className="text-muted-foreground">Teléfono: {cita.cliente.telefono}</p>
                  <p className="text-muted-foreground">Email: {cita.cliente.email}</p>
                </>
              ) : (
                <p className="text-muted-foreground">Sin cliente vinculado.</p>
              )}
            </div>

            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="mb-1 flex items-center gap-2 font-semibold">
                <Wrench className="h-4 w-4 text-brand-blue" aria-hidden="true" />
                Vehículo
              </p>
              <p>
                {cita.vehiculo.marca} {cita.vehiculo.modelo} {cita.vehiculo.version}
              </p>
              <p className="text-muted-foreground">Año: {cita.vehiculo.anio}</p>
              <p className="text-muted-foreground">Precio: {formatPrecio(cita.vehiculo.precio)}</p>
            </div>
          </div>

          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-4">
              <p className="font-semibold">Fecha y hora</p>
              <p className="text-muted-foreground">
                {formatFechaHora(cita.fechaHora)} · {rangoHorario(cita)} · {cita.duracionMinutos} min
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <p className="font-semibold">Registrada por</p>
              <p className="text-muted-foreground">{cita.createdByName ?? '—'}</p>
            </div>
          </div>

          {cita.observaciones && (
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="font-semibold">Observaciones</p>
              <p className="text-muted-foreground">{cita.observaciones}</p>
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
                  <Badge className={ESTADO_CITA_STYLES[entrada.estado]}>
                    {ESTADO_CITA_LABELS[entrada.estado]}
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

          <NotificacionesRecurso recursoId={cita.citaId} />

          {gestionaEstados && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <div className="space-y-2">
                <Label htmlFor="cita-observaciones">Observaciones</Label>
                <Textarea
                  id="cita-observaciones"
                  rows={2}
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                  placeholder="Notas de la gestión (opcional)."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {puedeConfirmarse(cita) && (
                  <Button onClick={confirmar} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    Confirmar cita
                  </Button>
                )}
                {puedeIniciarse(cita) && (
                  <Button onClick={iniciar} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Iniciar atención
                  </Button>
                )}
                {puedeFinalizarse(cita) && (
                  <Button onClick={finalizar} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Finalizar cita
                  </Button>
                )}
              </div>
            </div>
          )}

          {puedeReprogramarse(cita) && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <p className="text-sm font-semibold">Reprogramar</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cita-reprogramar-fecha">Nueva fecha y hora</Label>
                  <Input
                    id="cita-reprogramar-fecha"
                    type="datetime-local"
                    step={PASO_MINUTOS * 60}
                    value={fechaHora}
                    onChange={(event) => setFechaHora(event.target.value)}
                  />
                  {errorFecha && <p className="text-xs text-destructive">{errorFecha}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cita-reprogramar-duracion">Duración (minutos)</Label>
                  <Input
                    id="cita-reprogramar-duracion"
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

          {puedeCancelarse(cita) && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <div className="space-y-2">
                <Label htmlFor="cita-motivo">Motivo de cancelación</Label>
                <Textarea
                  id="cita-motivo"
                  rows={2}
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Motivo por el que se cancela la cita (opcional)."
                />
              </div>
              <Button variant="outline" onClick={cancelar} disabled={loading}>
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Cancelar cita
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
