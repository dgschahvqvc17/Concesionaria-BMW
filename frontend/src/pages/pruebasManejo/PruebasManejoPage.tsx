import { useMemo, useState } from 'react';
import { Car, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/PageHeader';
import { PruebaManejoDetalleDialog } from '@/components/pruebasManejo/PruebaManejoDetalleDialog';
import { PruebaManejoFormDialog } from '@/components/pruebasManejo/PruebaManejoFormDialog';
import { PruebasManejoTable } from '@/components/pruebasManejo/PruebasManejoTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientesComerciales } from '@/hooks/useClientesComerciales';
import { usePruebasManejo } from '@/hooks/usePruebasManejo';
import { useVehiculos } from '@/hooks/useVehiculos';
import { getErrorMessage } from '@/lib/api';
import { ESTADOS_PRUEBA, ESTADO_PRUEBA_LABELS } from '@/lib/pruebasManejo';
import type {
  CancelarPruebaInput,
  ConfirmarPruebaInput,
  CreatePruebaManejoInput,
  EstadoPrueba,
  RealizarPruebaInput,
  ReprogramarPruebaInput,
} from '@/types/pruebaManejo';

type FiltroEstado = 'todos' | EstadoPrueba;

/** Página de gestión de pruebas de manejo (HU11). */
export function PruebasManejoPage() {
  const { pruebas, loading, error, recargar, crear, confirmar, reprogramar, cancelar, realizar } =
    usePruebasManejo();
  const { clientes, loading: cargandoClientes } = useClientesComerciales();
  const { vehiculos, loading: cargandoVehiculos } = useVehiculos();

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pruebas.filter((prueba) => {
      if (filtroEstado !== 'todos' && prueba.estado !== filtroEstado) return false;
      if (!q) return true;
      const texto = `${prueba.numero} ${prueba.contacto.nombre} ${prueba.contacto.telefono} ${prueba.vehiculo.marca} ${prueba.vehiculo.modelo}`;
      return texto.toLowerCase().includes(q);
    });
  }, [pruebas, filtroEstado, busqueda]);

  const seleccionada = pruebas.find((p) => p.pruebaId === seleccionId) ?? null;

  const handleCrear = async (input: CreatePruebaManejoInput) => {
    setSubmitting(true);
    try {
      const prueba = await crear(input);
      toast.success(`Prueba ${prueba.numero} registrada correctamente.`);
      setFormOpen(false);
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
      throw submitError;
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmar = async (input: ConfirmarPruebaInput) => {
    if (!seleccionId) return;
    setDetalleLoading(true);
    try {
      await confirmar(seleccionId, input);
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleReprogramar = async (input: ReprogramarPruebaInput) => {
    if (!seleccionId) return;
    setDetalleLoading(true);
    try {
      await reprogramar(seleccionId, input);
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleCancelar = async (input: CancelarPruebaInput) => {
    if (!seleccionId) return;
    setDetalleLoading(true);
    try {
      await cancelar(seleccionId, input);
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleRealizar = async (input: RealizarPruebaInput) => {
    if (!seleccionId) return;
    setDetalleLoading(true);
    try {
      await realizar(seleccionId, input);
    } finally {
      setDetalleLoading(false);
    }
  };

  const abrirDetalle = (pruebaId: string) => {
    setSeleccionId(pruebaId);
    setDetalleOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operaciones"
        title="Pruebas de manejo"
        description="Agenda pruebas de manejo por vehículo, confirma la asistencia, repógramas o regístralas como realizadas."
        actions={
          <Button onClick={() => setFormOpen(true)} disabled={cargandoClientes || cargandoVehiculos}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva solicitud
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>
            Busca por número, solicitante o vehículo y filtra por estado. Los horarios van de 8:00 a 18:00.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Buscar prueba…"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
            <Select value={filtroEstado} onValueChange={(value) => setFiltroEstado(value as FiltroEstado)}>
              <SelectTrigger className="sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_PRUEBA.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {ESTADO_PRUEBA_LABELS[estado]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando pruebas…
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudieron cargar las pruebas</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={() => void recargar()}>
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          ) : filtradas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
              <Car className="h-8 w-8" aria-hidden="true" />
              {pruebas.length === 0
                ? 'Aún no hay pruebas de manejo registradas.'
                : 'No hay pruebas que coincidan con los filtros.'}
            </div>
          ) : (
            <PruebasManejoTable pruebas={filtradas} onVer={(p) => abrirDetalle(p.pruebaId)} />
          )}
        </CardContent>
      </Card>

      <PruebaManejoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vehiculos={vehiculos}
        clientes={clientes}
        onSubmit={handleCrear}
        loading={submitting}
      />

      <PruebaManejoDetalleDialog
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        prueba={seleccionada}
        onConfirmar={handleConfirmar}
        onReprogramar={handleReprogramar}
        onCancelar={handleCancelar}
        onRealizar={handleRealizar}
        loading={detalleLoading}
      />
    </div>
  );
}

export default PruebasManejoPage;
