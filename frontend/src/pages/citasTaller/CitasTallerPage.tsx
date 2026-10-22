import { useMemo, useState } from 'react';
import { Loader2, Plus, Wrench } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/PageHeader';
import { CitaTallerDetalleDialog } from '@/components/citasTaller/CitaTallerDetalleDialog';
import { CitaTallerFormDialog } from '@/components/citasTaller/CitaTallerFormDialog';
import { CitasTallerTable } from '@/components/citasTaller/CitasTallerTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCitasTaller } from '@/hooks/useCitasTaller';
import { useClientesComerciales } from '@/hooks/useClientesComerciales';
import { useMecanicos } from '@/hooks/useMecanicos';
import { useRepuestos } from '@/hooks/useRepuestos';
import { useVehiculos } from '@/hooks/useVehiculos';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import { ESTADOS_CITA, ESTADO_CITA_LABELS } from '@/lib/citasTaller';
import type {
  AsignarCitaInput,
  CancelarCitaInput,
  CitaTaller,
  CreateCitaTallerInput,
  EstadoCita,
  EstadoCitaInput,
  RegistrarAvanceInput,
  ReprogramarCitaInput,
} from '@/types/citaTaller';

type FiltroEstado = 'todos' | EstadoCita;

/** Página de gestión de citas del taller (HU13 + HU14 + HU15). */
export function CitasTallerPage() {
  const {
    citas,
    loading,
    error,
    recargar,
    crear,
    confirmar,
    reprogramar,
    iniciar,
    finalizar,
    cancelar,
    asignar,
    registrarAvance,
  } = useCitasTaller();
  const { clientes, loading: cargandoClientes } = useClientesComerciales();
  const { vehiculos, loading: cargandoVehiculos } = useVehiculos();
  const { mecanicos } = useMecanicos();
  const { repuestos } = useRepuestos();
  const { user } = useAuth();

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [filtroMecanico, setFiltroMecanico] = useState('todos');

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return citas.filter((cita) => {
      if (filtroEstado !== 'todos' && cita.estado !== filtroEstado) return false;
      if (filtroMecanico !== 'todos' && cita.mecanicoId !== filtroMecanico) return false;
      if (!q) return true;
      const texto = `${cita.numero} ${cita.cliente?.nombres ?? ''} ${cita.cliente?.apellidos ?? ''} ${cita.vehiculo.marca} ${cita.vehiculo.modelo}`;
      return texto.toLowerCase().includes(q);
    });
  }, [citas, filtroEstado, filtroMecanico, busqueda]);

  const seleccionada: CitaTaller | null = citas.find((c) => c.citaId === seleccionId) ?? null;

  const handleCrear = async (input: CreateCitaTallerInput) => {
    setSubmitting(true);
    try {
      const cita = await crear(input);
      toast.success(`Cita ${cita.numero} registrada correctamente.`);
      setFormOpen(false);
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
      throw submitError;
    } finally {
      setSubmitting(false);
    }
  };

  const conDetalle = async (ejecutar: (citaId: string) => Promise<unknown>) => {
    if (!seleccionId) return;
    setDetalleLoading(true);
    try {
      await ejecutar(seleccionId);
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleConfirmar = (input: EstadoCitaInput) => conDetalle((id) => confirmar(id, input));
  const handleReprogramar = (input: ReprogramarCitaInput) => conDetalle((id) => reprogramar(id, input));
  const handleIniciar = (input: EstadoCitaInput) => conDetalle((id) => iniciar(id, input));
  const handleFinalizar = (input: EstadoCitaInput) => conDetalle((id) => finalizar(id, input));
  const handleCancelar = (input: CancelarCitaInput) => conDetalle((id) => cancelar(id, input));
  const handleAsignar = (input: AsignarCitaInput) => conDetalle((id) => asignar(id, input));
  const handleRegistrarAvance = (input: RegistrarAvanceInput) => conDetalle((id) => registrarAvance(id, input));

  const abrirDetalle = (citaId: string) => {
    setSeleccionId(citaId);
    setDetalleOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Taller"
        title="Citas del taller"
        description="Registra y administra las citas de mantenimiento y reparación: confirma, reprograma, atiende y finaliza la agenda del taller."
        actions={
          <Button onClick={() => setFormOpen(true)} disabled={cargandoClientes || cargandoVehiculos}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva cita
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>
            Busca por número, cliente o vehículo y filtra por estado. El horario de atención va de 8:00 a 18:00.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Buscar cita…"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
            <Select value={filtroEstado} onValueChange={(value) => setFiltroEstado(value as FiltroEstado)}>
              <SelectTrigger className="sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_CITA.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {ESTADO_CITA_LABELS[estado]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroMecanico} onValueChange={setFiltroMecanico}>
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="Todos los mecánicos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los mecánicos</SelectItem>
                {mecanicos.map((mecanico) => (
                  <SelectItem key={mecanico.userId} value={mecanico.userId}>
                    {mecanico.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando citas…
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudieron cargar las citas</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={() => void recargar()}>
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          ) : filtradas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
              <Wrench className="h-8 w-8" aria-hidden="true" />
              {citas.length === 0
                ? 'Aún no hay citas del taller registradas.'
                : 'No hay citas que coincidan con los filtros.'}
            </div>
          ) : (
            <CitasTallerTable citas={filtradas} onVer={(c) => abrirDetalle(c.citaId)} />
          )}
        </CardContent>
      </Card>

      <CitaTallerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vehiculos={vehiculos}
        clientes={clientes}
        onSubmit={handleCrear}
        loading={submitting}
      />

      <CitaTallerDetalleDialog
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        cita={seleccionada}
        mecanicos={mecanicos}
        repuestos={repuestos}
        usuarioId={user?.sub ?? null}
        rolesUsuario={user?.roles ?? []}
        onConfirmar={handleConfirmar}
        onReprogramar={handleReprogramar}
        onIniciar={handleIniciar}
        onFinalizar={handleFinalizar}
        onCancelar={handleCancelar}
        onAsignar={handleAsignar}
        onRegistrarAvance={handleRegistrarAvance}
        loading={detalleLoading}
      />
    </div>
  );
}

export default CitasTallerPage;
