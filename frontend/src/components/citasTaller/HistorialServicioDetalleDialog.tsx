import { FileText, Wrench } from 'lucide-react';
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
  ESTADO_CITA_LABELS,
  ESTADO_CITA_STYLES,
  TIPO_SERVICIO_LABELS,
  formatFechaHora,
  rangoHorario,
} from '@/lib/citasTaller';
import { formatPrecio } from '@/lib/repuestos';
import type { CitaTaller, RepuestoUtilizado } from '@/types/citaTaller';

interface HistorialServicioDetalleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicio: CitaTaller | null;
}

/** Detalle de solo lectura de un servicio del historial del vehículo (HU16). */
export function HistorialServicioDetalleDialog({
  open,
  onOpenChange,
  servicio,
}: HistorialServicioDetalleDialogProps) {
  if (!servicio) return null;

  const repuestos = servicio.repuestosUtilizados ?? [];
  const tareas = servicio.tareas ?? [];
  const archivos = servicio.archivos ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            {servicio.numero}
            <Badge className={ESTADO_CITA_STYLES[servicio.estado]}>
              {ESTADO_CITA_LABELS[servicio.estado]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {TIPO_SERVICIO_LABELS[servicio.tipoServicio]} · {formatFechaHora(servicio.fechaHora)} ·{' '}
            {rangoHorario(servicio)}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-4">
              <p className="mb-1 flex items-center gap-2 font-semibold">
                <Wrench className="h-4 w-4 text-brand-blue" aria-hidden="true" />
                Vehículo
              </p>
              <p>
                {servicio.vehiculo.marca} {servicio.vehiculo.modelo} {servicio.vehiculo.version}
              </p>
              <p className="text-muted-foreground">Año: {servicio.vehiculo.anio}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <p className="mb-1 font-semibold">Cliente</p>
              {servicio.cliente ? (
                <>
                  <p>
                    {servicio.cliente.nombres} {servicio.cliente.apellidos}
                  </p>
                  <p className="text-muted-foreground">Email: {servicio.cliente.email}</p>
                  <p className="text-muted-foreground">Teléfono: {servicio.cliente.telefono}</p>
                </>
              ) : (
                <p className="text-muted-foreground">Sin cliente vinculado.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-4">
              <p className="font-semibold">Responsable del servicio</p>
              <p className="text-muted-foreground">{servicio.mecanico?.nombre ?? 'Sin asignar.'}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <p className="font-semibold">Fechas de atención</p>
              <p className="text-muted-foreground">
                {servicio.fechaInicioReal ? formatFechaHora(servicio.fechaInicioReal) : '—'} →{' '}
                {servicio.fechaFinReal ? formatFechaHora(servicio.fechaFinReal) : '—'}
              </p>
            </div>
          </div>

          {servicio.diagnostico && (
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="font-semibold">Diagnóstico</p>
              <p className="text-muted-foreground">{servicio.diagnostico}</p>
            </div>
          )}

          {servicio.observacionesTecnicas && (
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="font-semibold">Observaciones técnicas</p>
              <p className="text-muted-foreground">{servicio.observacionesTecnicas}</p>
            </div>
          )}

          {tareas.length > 0 && (
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="font-semibold">Tareas realizadas</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {tareas.map((tarea, index) => (
                  <li key={`${tarea.descripcion}-${index}`}>· {tarea.descripcion}</li>
                ))}
              </ul>
            </div>
          )}

          {repuestos.length > 0 && (
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="font-semibold">Repuestos utilizados</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {repuestos.map((repuesto: RepuestoUtilizado, index) => (
                  <li key={`${repuesto.repuestoId}-${index}`}>
                    · {repuesto.codigo} — {repuesto.nombre} × {repuesto.cantidad} (
                    {formatPrecio(repuesto.precioUnitario)} c/u)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {archivos.length > 0 && (
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="font-semibold">Fotografías y documentos</p>
              <ul className="mt-1 space-y-1">
                {archivos.map((archivo) => (
                  <li key={archivo.key} className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {archivo.url ? (
                      <a
                        href={archivo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-foreground hover:underline"
                      >
                        {archivo.nombre}
                      </a>
                    ) : (
                      <span className="truncate">{archivo.nombre}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {servicio.observaciones && (
            <div className="rounded-xl border border-border/60 p-4 text-sm">
              <p className="font-semibold">Observaciones</p>
              <p className="text-muted-foreground">{servicio.observaciones}</p>
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
