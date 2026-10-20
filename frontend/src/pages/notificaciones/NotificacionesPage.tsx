import { useMemo, useState } from 'react';
import { Mail, MailQuestion, MailWarning } from 'lucide-react';
import { toast } from 'sonner';

import { NotificacionDetalleDialog } from '@/components/notificaciones/NotificacionDetalleDialog';
import { NotificacionesTable } from '@/components/notificaciones/NotificacionesTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { getErrorMessage } from '@/lib/api';
import {
  ESTADOS_NOTIFICACION,
  ESTADO_NOTIFICACION_LABELS,
  TIPOS_NOTIFICACION,
  TIPO_NOTIFICACION_LABELS,
  abrirMailto,
} from '@/lib/notificaciones';
import type { EstadoNotificacion, Notificacion, TipoNotificacion } from '@/types/notificacion';

type FiltroTipo = 'todos' | TipoNotificacion;
type FiltroEstado = 'todos' | EstadoNotificacion;

/** Página de notificaciones por correo de las operaciones comerciales (HU12). */
export function NotificacionesPage() {
  const { notificaciones, loading, error, recargar, enviar } = useNotificaciones();

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  const filtradas = useMemo(
    () =>
      notificaciones.filter((notificacion) => {
        if (filtroTipo !== 'todos' && notificacion.tipo !== filtroTipo) return false;
        if (filtroEstado !== 'todos' && notificacion.estado !== filtroEstado) return false;
        return true;
      }),
    [notificaciones, filtroTipo, filtroEstado]
  );

  const seleccionada = notificaciones.find((n) => n.eventoId === seleccionId) ?? null;
  const pendientes = notificaciones.filter((n) => n.estado === 'pendiente').length;

  const handleEnviar = async (notificacion: Notificacion) => {
    setEnviandoId(notificacion.eventoId);
    try {
      const mailto = await enviar(notificacion.eventoId);
      abrirMailto(mailto);
      toast.success('Se abrió tu cliente de correo con el mensaje redactado.');
    } catch (sendError) {
      toast.error(getErrorMessage(sendError));
    } finally {
      setEnviandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operaciones"
        title="Correos"
        description="Notificaciones de reservas, cotizaciones, pruebas de manejo y ventas. Cada intento de envío queda registrado para evitar duplicados."
        actions={
          <Button variant="outline" onClick={() => void recargar()}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            Actualizar
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>
            {pendientes > 0
              ? `Hay ${pendientes} notificación(es) pendiente(s) de enviar.`
              : 'Todos los correos de eventos ya fueron intentados o no tienen destinatario.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={filtroTipo} onValueChange={(value) => setFiltroTipo(value as FiltroTipo)}>
              <SelectTrigger className="sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {TIPOS_NOTIFICACION.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {TIPO_NOTIFICACION_LABELS[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroEstado} onValueChange={(value) => setFiltroEstado(value as FiltroEstado)}>
              <SelectTrigger className="sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_NOTIFICACION.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {ESTADO_NOTIFICACION_LABELS[estado]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
              <MailQuestion className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando notificaciones…
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudieron cargar las notificaciones</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={() => void recargar()}>
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          ) : filtradas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
              <MailWarning className="h-8 w-8" aria-hidden="true" />
              {notificaciones.length === 0
                ? 'Aún no hay notificaciones registradas.'
                : 'No hay notificaciones que coincidan con los filtros.'}
            </div>
          ) : (
            <NotificacionesTable
              notificaciones={filtradas}
              onVer={(notificacion) => {
                setSeleccionId(notificacion.eventoId);
                setDetalleOpen(true);
              }}
              onEnviar={(notificacion) => void handleEnviar(notificacion)}
              enviandoId={enviandoId}
            />
          )}
        </CardContent>
      </Card>

      <NotificacionDetalleDialog
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        notificacion={seleccionada}
        onEnviar={(notificacion) => void handleEnviar(notificacion)}
        enviando={Boolean(enviandoId)}
      />
    </div>
  );
}

export default NotificacionesPage;
