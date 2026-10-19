import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useClientesComerciales } from '@/hooks/useClientesComerciales';
import { useCotizaciones } from '@/hooks/useCotizaciones';
import { useReservas } from '@/hooks/useReservas';
import { getErrorMessage } from '@/lib/api';
import { abrirCorreoConsulta } from '@/lib/consultaEmail';
import { descargarCotizacionPdf } from '@/lib/cotizacionPdf';
import { ESTADO_COTIZACION_LABELS, ESTADO_COTIZACION_STYLES } from '@/lib/cotizaciones';
import { ESTADO_RESERVA_LABELS, ESTADO_RESERVA_STYLES } from '@/lib/reservas';
import { formatFecha, formatPrecio } from '@/lib/repuestos';
import { clientesComercialesService } from '@/services/clientesComerciales';
import type { ClienteComercial } from '@/types/clienteComercial';

export function ClienteComercialDetallePage() {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const { agregarConsulta, recargar } = useClientesComerciales();
  const { cotizaciones, loading: cargandoCotizaciones } = useCotizaciones({ clienteId });
  const { reservas, loading: cargandoReservas } = useReservas({ clienteId });
  const [cliente, setCliente] = useState<ClienteComercial | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [vehiculo, setVehiculo] = useState('');
  const [interes, setInteres] = useState('');
  const [observacion, setObservacion] = useState('');
  const [notificar, setNotificar] = useState(true);

  useEffect(() => {
    if (!clienteId) return;
    clientesComercialesService
      .get(clienteId)
      .then((r) => setCliente(r.cliente))
      .catch((loadError) => toast.error(getErrorMessage(loadError)))
      .finally(() => setCargando(false));
  }, [clienteId]);

  const guardarConsulta = async () => {
    if (!clienteId || !cliente || !interes.trim()) return;
    setGuardando(true);
    try {
      await agregarConsulta(clienteId, { vehiculo, interes, observacion });
      if (notificar) abrirCorreoConsulta(cliente, { vehiculo, interes, observacion });
      toast.success(
        notificar
          ? 'Consulta registrada. Se abrió tu correo para enviar la confirmación.'
          : 'Consulta registrada correctamente.'
      );
      const r = await clientesComercialesService.get(clienteId);
      setCliente(r.cliente);
      setVehiculo(''); setInteres(''); setObservacion('');
      await recargar();
    } catch (saveError) {
      toast.error(getErrorMessage(saveError));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <div className="p-6">Cargando…</div>;
  if (!cliente) return <div className="p-6">No se pudo cargar el cliente.</div>;

  return (
    <div className="space-y-6">
      <PageHeader title={`${cliente.nombres} ${cliente.apellidos}`} description={`Documento: ${cliente.documento} | Email: ${cliente.email}`} actions={<div className="flex gap-2"><Button variant="outline" onClick={() => navigate('/cotizaciones')}>Nueva cotización</Button><Button variant="outline" onClick={() => navigate(-1)}>Volver</Button></div>} />
      <Card>
        <CardHeader><CardTitle>Datos</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <div><strong>Teléfono:</strong> {cliente.telefono}</div>
          <div><strong>Estado seguimiento:</strong> {cliente.estadoSeguimiento}</div>
          {cliente.notas && <div className="sm:col-span-2"><strong>Notas:</strong> {cliente.notas}</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Registrar consulta</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div><Label>Vehículo</Label><Input value={vehiculo} onChange={(e) => setVehiculo(e.target.value)} /></div>
            <div><Label>Interés</Label><Input value={interes} onChange={(e) => setInteres(e.target.value)} /></div>
          </div>
          <div><Label>Observación</Label><Textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={notificar}
              onChange={(e) => setNotificar(e.target.checked)}
            />
            Notificar al cliente por correo (abre tu gestor de correo)
          </label>
          <Button onClick={guardarConsulta} disabled={guardando || !interes.trim()}>Guardar consulta</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Historial de consultas</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {(cliente.consultas||[]).map((c,i) => (
              <li key={i} className="border rounded p-2">
                <div className="text-sm text-muted-foreground">{formatFecha(c.fecha)}</div>
                {c.vehiculo && <div><strong>Vehículo:</strong> {c.vehiculo}</div>}
                <div><strong>Interés:</strong> {c.interes}</div>
                {c.observacion && <div><strong>Observación:</strong> {c.observacion}</div>}
              </li>
            ))}
            {(cliente.consultas||[]).length === 0 && <div>Sin consultas registradas</div>}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Cotizaciones</CardTitle></CardHeader>
        <CardContent>
          {cargandoCotizaciones ? (
            <p className="text-sm text-muted-foreground">Cargando cotizaciones…</p>
          ) : cotizaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cotizaciones registradas.</p>
          ) : (
            <ul className="space-y-2">
              {cotizaciones.map((cotizacion) => (
                <li key={cotizacion.cotizacionId} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2">
                  <div className="min-w-0">
                    <div className="font-medium">{cotizacion.numero} · {formatPrecio(cotizacion.total)}</div>
                    <div className="text-xs text-muted-foreground">Vence {formatFecha(cotizacion.fechaVencimiento)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={ESTADO_COTIZACION_STYLES[cotizacion.estado]}>
                      {ESTADO_COTIZACION_LABELS[cotizacion.estado]}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => descargarCotizacionPdf(cotizacion)}>
                      PDF
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Reservas</CardTitle></CardHeader>
        <CardContent>
          {cargandoReservas ? (
            <p className="text-sm text-muted-foreground">Cargando reservas…</p>
          ) : reservas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin reservas registradas.</p>
          ) : (
            <ul className="space-y-2">
              {reservas.map((reserva) => (
                <li key={reserva.reservaId} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {reserva.numero} · {reserva.vehiculo.marca} {reserva.vehiculo.modelo}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Vence {formatFecha(reserva.fechaVencimiento)}
                      {reserva.monto != null ? ` · ${formatPrecio(reserva.monto)}` : ''}
                    </div>
                  </div>
                  <Badge className={ESTADO_RESERVA_STYLES[reserva.estado]}>
                    {ESTADO_RESERVA_LABELS[reserva.estado]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}