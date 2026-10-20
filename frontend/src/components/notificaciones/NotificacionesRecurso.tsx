import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import {
  ESTADO_NOTIFICACION_LABELS,
  ESTADO_NOTIFICACION_STYLES,
  abrirMailto,
  eventoLabel,
} from '@/lib/notificaciones';

interface NotificacionesRecursoProps {
  recursoId: string;
}

/** Sección compacta con los correos registrados de una operación (HU12). */
export function NotificacionesRecurso({ recursoId }: NotificacionesRecursoProps) {
  const { notificaciones, loading, enviar } = useNotificaciones({ recursoId });
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/60 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Cargando notificaciones…
      </div>
    );
  }

  if (notificaciones.length === 0) return null;

  const handleEnviar = async (eventoId: string) => {
    setEnviandoId(eventoId);
    try {
      const mailto = await enviar(eventoId);
      abrirMailto(mailto);
      toast.success('Se abrió tu cliente de correo con el mensaje redactado.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setEnviandoId(null);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-border/60 p-4">
      <p className="text-sm font-semibold">Notificaciones por correo</p>
      <ul className="space-y-2">
        {notificaciones.map((notificacion) => {
          const agotados = notificacion.intentos >= notificacion.maxIntentos;
          const puedeEnviar = notificacion.estado !== 'omitido' && !agotados;
          return (
            <li
              key={notificacion.eventoId}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 p-2 text-sm"
            >
              <span className="font-medium">{eventoLabel(notificacion.evento)}</span>
              <Badge className={ESTADO_NOTIFICACION_STYLES[notificacion.estado]}>
                {ESTADO_NOTIFICACION_LABELS[notificacion.estado]}
              </Badge>
              <span className="text-muted-foreground">
                {notificacion.intentos}/{notificacion.maxIntentos} intentos
              </span>
              {puedeEnviar && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => void handleEnviar(notificacion.eventoId)}
                  disabled={enviandoId === notificacion.eventoId}
                >
                  {enviandoId === notificacion.eventoId ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  )}
                  Enviar
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
