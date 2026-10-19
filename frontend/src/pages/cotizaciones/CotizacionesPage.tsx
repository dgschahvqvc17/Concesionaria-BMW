import { useMemo, useState } from 'react';
import { FileText, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { CotizacionDetalleDialog } from '@/components/cotizaciones/CotizacionDetalleDialog';
import { CotizacionFormDialog } from '@/components/cotizaciones/CotizacionFormDialog';
import { CotizacionesTable } from '@/components/cotizaciones/CotizacionesTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientesComerciales } from '@/hooks/useClientesComerciales';
import { useCotizaciones } from '@/hooks/useCotizaciones';
import { useVehiculos } from '@/hooks/useVehiculos';
import { getErrorMessage } from '@/lib/api';
import { ESTADOS_COTIZACION, ESTADO_COTIZACION_LABELS } from '@/lib/cotizaciones';
import type { CreateCotizacionInput, EstadoCotizacion, UpdateCotizacionInput } from '@/types/cotizacion';

type FiltroEstado = 'todos' | EstadoCotizacion;

const ESTADOS_COTIZABLES = ['disponible', 'reservado'];

/** Página de cotizaciones comerciales (HU08). */
export function CotizacionesPage() {
  const { cotizaciones, loading, error, recargar, crear, actualizar } = useCotizaciones();
  const { clientes, loading: cargandoClientes } = useClientesComerciales();
  const { vehiculos, loading: cargandoVehiculos } = useVehiculos();

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);

  const vehiculosCotizables = useMemo(
    () => vehiculos.filter((vehiculo) => ESTADOS_COTIZABLES.includes(vehiculo.estado)),
    [vehiculos]
  );

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return cotizaciones.filter((cotizacion) => {
      if (filtroEstado !== 'todos' && cotizacion.estado !== filtroEstado) return false;
      if (!q) return true;
      const texto = `${cotizacion.numero} ${cotizacion.cliente.nombres} ${cotizacion.cliente.apellidos} ${cotizacion.cliente.documento}`;
      return texto.toLowerCase().includes(q);
    });
  }, [cotizaciones, filtroEstado, busqueda]);

  const seleccionada = cotizaciones.find((c) => c.cotizacionId === seleccionId) ?? null;

  const handleCrear = async (input: CreateCotizacionInput) => {
    setSubmitting(true);
    try {
      const cotizacion = await crear(input);
      toast.success(`Cotización ${cotizacion.numero} generada correctamente.`);
      setFormOpen(false);
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
      throw submitError;
    } finally {
      setSubmitting(false);
    }
  };

  const handleActualizar = async (input: UpdateCotizacionInput) => {
    if (!seleccionId) return;
    setDetalleLoading(true);
    try {
      await actualizar(seleccionId, input);
    } finally {
      setDetalleLoading(false);
    }
  };

  const abrirDetalle = (cotizacionId: string) => {
    setSeleccionId(cotizacionId);
    setDetalleOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comercial"
        title="Cotizaciones"
        description="Genera propuestas para tus clientes con los precios vigentes, aplica descuentos autorizados y da seguimiento a su estado."
        actions={
          <Button onClick={() => setFormOpen(true)} disabled={cargandoClientes || cargandoVehiculos}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva cotización
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Busca por número, cliente o documento y filtra por estado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Buscar cotización…"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
            <Select value={filtroEstado} onValueChange={(value) => setFiltroEstado(value as FiltroEstado)}>
              <SelectTrigger className="sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_COTIZACION.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {ESTADO_COTIZACION_LABELS[estado]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando cotizaciones…
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudieron cargar las cotizaciones</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={() => void recargar()}>
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          ) : filtradas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
              <FileText className="h-8 w-8" aria-hidden="true" />
              {cotizaciones.length === 0
                ? 'Aún no hay cotizaciones registradas.'
                : 'No hay cotizaciones que coincidan con los filtros.'}
            </div>
          ) : (
            <CotizacionesTable cotizaciones={filtradas} onVer={(c) => abrirDetalle(c.cotizacionId)} />
          )}
        </CardContent>
      </Card>

      <CotizacionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        clientes={clientes}
        vehiculos={vehiculosCotizables}
        onSubmit={handleCrear}
        loading={submitting}
      />

      <CotizacionDetalleDialog
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        cotizacion={seleccionada}
        onSubmit={handleActualizar}
        loading={detalleLoading}
      />
    </div>
  );
}

export default CotizacionesPage;
