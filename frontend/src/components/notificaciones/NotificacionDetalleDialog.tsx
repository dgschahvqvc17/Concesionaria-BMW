import { Loader2, Mail, X } from 'lucide-react';

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
  ESTADO_NOTIFICACION_LABELS,
  ESTADO_NOTIFICACION_STYLES,
  TIPO_NOTIFICACION_LABELS,
  eventoLabel,
} from '@/lib/notificaciones';
import { formatFecha } from '@/lib/repuestos';
import type { Notificacion } from '@/types/notificacion';

interface NotificacionDetalleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificacion: Notificacion | null;
  onEnviar?: (notificacion: Notificacion) => void;
  enviando?: boolean;
}

/** Detalle de una notificación: asunto, cuerpo redactado e historial de intentos (HU12). */
export function NotificacionDetalleDialog({
  open,
  onOpenChange,
  notificacion,
  onEnviar,
  enviando,
}: NotificacionDetalleDialogProps) {
  if (!notificacion) return null;

  const agotados = notificacion.intentos >= notificacion.maxIntentos;
  const puedeEnviar = Boolean(onEnviar) && notificacion.estado !== 'omitido' && !agotados;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            {eventoLabel(notificacion.evento)}
            <Badge className={ESTADO_NOTIFICACION_STYLES[notificacion.estado]}>
              {ESTADO_NOTIFICACION_LABELS[notificacion.estado]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {TIPO_NOTIFICACION_LABELS[notificacion.tipo]}
            {notificacion.numero ? ` · ${notificacion.numero}` : ''} · Registrada el {formatFecha(notificacion.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 p-4">
              <p className="font-semibold">Destinatario</p>
              <p className="text-muted-foreground">{notificacion.destinatarioNombre ?? '—'}</p>
              <p className="text-muted-foreground">{notificacion.destinatario ?? 'Sin correo de contacto'}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <p className="font-semibold">Intentos de envío</p>
              <p className="text-muted-foreground">
                {notificacion.intentos} de {notificacion.maxIntentos}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 p-4 text-sm">
            <p className="font-semibold">Asunto</p>
            <p className="text-muted-foreground">{notificacion.asunto}</p>
          </div>

          <div className="rounded-xl border border-border/60 p-4 text-sm">
            <p className="mb-2 font-semibold">Mensaje</p>
            <pre className="whitespace-pre-wrap font-sans text-muted-foreground">{notificacion.cuerpo}</pre>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Historial de intentos</p>
            <ul className="space-y-2">
              {notificacion.historial.map((entrada, index) => (
                <li
                  key={`${entrada.fecha}-${index}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 p-2 text-sm"
                >
                  <span className="font-medium">{entrada.resultado}</span>
                  <span className="text-muted-foreground">{formatFecha(entrada.fecha)}</span>
                  {entrada.detalle && <span className="text-muted-foreground">· {entrada.detalle}</span>}
                </li>
              ))}
              {notificacion.historial.length === 0 && <li className="text-sm text-muted-foreground">Sin intentos.</li>}
            </ul>
          </div>

          {notificacion.estado === 'omitido' && (
            <div className="flex items-start gap-3 rounded-xl border border-border/60 p-4 text-sm">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
              <p className="text-muted-foreground">
                La operación no tenía un correo de contacto válido cuando se registró el evento, por lo que no se puede
                generar el mensaje.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {notificacion.estado !== 'omitido' && onEnviar && (
            <Button onClick={() => onEnviar(notificacion)} disabled={enviando || !puedeEnviar}>
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
              {agotados ? 'Intentos agotados' : 'Enviar por correo'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
