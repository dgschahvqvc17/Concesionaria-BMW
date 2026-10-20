import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ESTADO_NOTIFICACION_LABELS,
  ESTADO_NOTIFICACION_STYLES,
  TIPO_NOTIFICACION_LABELS,
  eventoLabel,
} from '@/lib/notificaciones';
import { formatFecha } from '@/lib/repuestos';
import type { Notificacion } from '@/types/notificacion';

interface NotificacionesTableProps {
  notificaciones: Notificacion[];
  onVer: (notificacion: Notificacion) => void;
  onEnviar?: (notificacion: Notificacion) => void;
  enviandoId?: string | null;
}

/** Listado de notificaciones por correo con su estado de envío (HU12). */
export function NotificacionesTable({ notificaciones, onVer, onEnviar, enviandoId }: NotificacionesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Evento</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Destinatario</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-center">Intentos</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {notificaciones.map((notificacion) => {
          const agotados = notificacion.intentos >= notificacion.maxIntentos;
          const puedeEnviar = onEnviar && notificacion.estado !== 'omitido' && !agotados;
          return (
            <TableRow key={notificacion.eventoId}>
              <TableCell>
                <p className="font-medium">{eventoLabel(notificacion.evento)}</p>
                {notificacion.numero && <p className="text-xs text-muted-foreground">{notificacion.numero}</p>}
              </TableCell>
              <TableCell>{TIPO_NOTIFICACION_LABELS[notificacion.tipo]}</TableCell>
              <TableCell className="text-muted-foreground">{notificacion.destinatario ?? '—'}</TableCell>
              <TableCell>
                <Badge className={ESTADO_NOTIFICACION_STYLES[notificacion.estado]}>
                  {ESTADO_NOTIFICACION_LABELS[notificacion.estado]}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {notificacion.intentos}/{notificacion.maxIntentos}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatFecha(notificacion.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {puedeEnviar && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEnviar(notificacion)}
                      disabled={enviandoId === notificacion.eventoId}
                    >
                      {enviandoId === notificacion.eventoId ? 'Abriendo…' : 'Enviar'}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => onVer(notificacion)}>
                    Ver
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
