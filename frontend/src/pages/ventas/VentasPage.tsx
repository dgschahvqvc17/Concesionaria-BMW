import { useMemo, useState } from 'react';
import { ReceiptText, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/PageHeader';
import { VentaDetalleDialog } from '@/components/ventas/VentaDetalleDialog';
import { VentaFormDialog } from '@/components/ventas/VentaFormDialog';
import { VentasTable } from '@/components/ventas/VentasTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useClientesComerciales } from '@/hooks/useClientesComerciales';
import { useVehiculos } from '@/hooks/useVehiculos';
import { useVentas } from '@/hooks/useVentas';
import { getErrorMessage } from '@/lib/api';
import { esVendible } from '@/lib/ventas';
import type { CreateVentaInput } from '@/types/venta';

/** Página de ventas de vehículos (HU10). */
export function VentasPage() {
  const { ventas, loading, error, recargar, crear } = useVentas();
  const { clientes, loading: cargandoClientes } = useClientesComerciales();
  const { vehiculos, loading: cargandoVehiculos } = useVehiculos();

  const [busqueda, setBusqueda] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);

  const vehiculosVendibles = useMemo(() => vehiculos.filter(esVendible), [vehiculos]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return ventas.filter((venta) => {
      if (!q) return true;
      const texto = `${venta.numero} ${venta.cliente.nombres} ${venta.cliente.apellidos} ${venta.cliente.documento} ${venta.vehiculo.marca} ${venta.vehiculo.modelo} ${venta.numeroReserva ?? ''}`;
      return texto.toLowerCase().includes(q);
    });
  }, [ventas, busqueda]);

  const seleccionada = ventas.find((v) => v.ventaId === seleccionId) ?? null;

  const handleCrear = async (input: CreateVentaInput) => {
    setSubmitting(true);
    try {
      const venta = await crear(input);
      toast.success(`Venta ${venta.numero} registrada correctamente.`);
      setFormOpen(false);
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
      throw submitError;
    } finally {
      setSubmitting(false);
    }
  };

  const abrirDetalle = (ventaId: string) => {
    setSeleccionId(ventaId);
    setDetalleOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comercial"
        title="Ventas"
        description="Registra las operaciones comerciales, consulta su historial y descarga el comprobante de cada venta."
        actions={
          <Button onClick={() => setFormOpen(true)} disabled={cargandoClientes || cargandoVehiculos}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva venta
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Historial de ventas</CardTitle>
          <CardDescription>Busca por número, cliente, documento, vehículo o reserva.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar venta…"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando ventas…
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudieron cargar las ventas</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={() => void recargar()}>
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          ) : filtradas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
              <ReceiptText className="h-8 w-8" aria-hidden="true" />
              {ventas.length === 0
                ? 'Aún no hay ventas registradas.'
                : 'No hay ventas que coincidan con la búsqueda.'}
            </div>
          ) : (
            <VentasTable ventas={filtradas} onVer={(v) => abrirDetalle(v.ventaId)} />
          )}
        </CardContent>
      </Card>

      <VentaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        clientes={clientes}
        vehiculos={vehiculosVendibles}
        onSubmit={handleCrear}
        loading={submitting}
      />

      <VentaDetalleDialog open={detalleOpen} onOpenChange={setDetalleOpen} venta={seleccionada} />
    </div>
  );
}

export default VentasPage;
