import { useMemo, useState } from 'react';
import { CalendarCheck, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/PageHeader';
import { ReservaDetalleDialog } from '@/components/reservas/ReservaDetalleDialog';
import { ReservaFormDialog } from '@/components/reservas/ReservaFormDialog';
import { ReservasTable } from '@/components/reservas/ReservasTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientesComerciales } from '@/hooks/useClientesComerciales';
import { useReservas } from '@/hooks/useReservas';
import { useVehiculos } from '@/hooks/useVehiculos';
import { getErrorMessage } from '@/lib/api';
import { ESTADOS_RESERVA, ESTADO_RESERVA_LABELS } from '@/lib/reservas';
import type { CancelarReservaInput, ConvertirReservaInput, CreateReservaInput, EstadoReserva } from '@/types/reserva';

type FiltroEstado = 'todos' | EstadoReserva;

/** Página de reservas de vehículos (HU09). */
export function ReservasPage() {
  const { reservas, loading, error, recargar, crear, cancelar, convertir } = useReservas();
  const { clientes, loading: cargandoClientes } = useClientesComerciales();
  const { vehiculos, loading: cargandoVehiculos } = useVehiculos();

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);

  const vehiculosDisponibles = useMemo(
    () => vehiculos.filter((vehiculo) => vehiculo.estado === 'disponible'),
    [vehiculos]
  );

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return reservas.filter((reserva) => {
      if (filtroEstado !== 'todos' && reserva.estado !== filtroEstado) return false;
      if (!q) return true;
      const texto = `${reserva.numero} ${reserva.cliente.nombres} ${reserva.cliente.apellidos} ${reserva.cliente.documento} ${reserva.vehiculo.marca} ${reserva.vehiculo.modelo}`;
      return texto.toLowerCase().includes(q);
    });
  }, [reservas, filtroEstado, busqueda]);

  const seleccionada = reservas.find((r) => r.reservaId === seleccionId) ?? null;

  const handleCrear = async (input: CreateReservaInput) => {
    setSubmitting(true);
    try {
      const reserva = await crear(input);
      toast.success(`Reserva ${reserva.numero} registrada correctamente.`);
      setFormOpen(false);
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
      throw submitError;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelar = async (input: CancelarReservaInput) => {
    if (!seleccionId) return;
    setDetalleLoading(true);
    try {
      await cancelar(seleccionId, input);
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleConvertir = async (input: ConvertirReservaInput) => {
    if (!seleccionId) return;
    setDetalleLoading(true);
    try {
      await convertir(seleccionId, input);
    } finally {
      setDetalleLoading(false);
    }
  };

  const abrirDetalle = (reservaId: string) => {
    setSeleccionId(reservaId);
    setDetalleOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comercial"
        title="Reservas"
        description="Aparta vehículos disponibles para tus clientes, consulta su vigencia y conviértelas en venta o cancélalas."
        actions={
          <Button onClick={() => setFormOpen(true)} disabled={cargandoClientes || cargandoVehiculos}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva reserva
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Busca por número, cliente, documento o vehículo y filtra por estado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Buscar reserva…"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
            <Select value={filtroEstado} onValueChange={(value) => setFiltroEstado(value as FiltroEstado)}>
              <SelectTrigger className="sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_RESERVA.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {ESTADO_RESERVA_LABELS[estado]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando reservas…
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudieron cargar las reservas</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={() => void recargar()}>
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          ) : filtradas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
              <CalendarCheck className="h-8 w-8" aria-hidden="true" />
              {reservas.length === 0
                ? 'Aún no hay reservas registradas.'
                : 'No hay reservas que coincidan con los filtros.'}
            </div>
          ) : (
            <ReservasTable reservas={filtradas} onVer={(r) => abrirDetalle(r.reservaId)} />
          )}
        </CardContent>
      </Card>

      <ReservaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        clientes={clientes}
        vehiculos={vehiculosDisponibles}
        onSubmit={handleCrear}
        loading={submitting}
      />

      <ReservaDetalleDialog
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        reserva={seleccionada}
        onCancelar={handleCancelar}
        onConvertir={handleConvertir}
        loading={detalleLoading}
      />
    </div>
  );
}

export default ReservasPage;
