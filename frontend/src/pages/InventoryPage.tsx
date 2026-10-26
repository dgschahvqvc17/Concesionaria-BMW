import { useMemo, useState } from 'react';
import { Car, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  FILTROS_VACIOS,
  InventarioFiltros,
  type InventarioFilters,
} from '@/components/inventory/InventarioFiltros';
import { VehiculoDetalleDialog } from '@/components/inventory/VehiculoDetalleDialog';
import { VehiculoFormDialog } from '@/components/inventory/VehiculoFormDialog';
import { VehiculosTable } from '@/components/inventory/VehiculosTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useVehiculos } from '@/hooks/useVehiculos';
import { getErrorMessage } from '@/lib/api';
import { nivelStock } from '@/lib/vehiculos';
import type {
  CreateVehiculoInput,
  EstadoVehiculo,
  UpdateVehiculoInput,
  Vehiculo,
} from '@/types/vehiculo';

function aNumero(valor: string): number | undefined {
  return valor.trim() === '' ? undefined : Number(valor);
}

/** Página del inventario de vehículos (HU03). */
export function InventoryPage() {
  const { user } = useAuth();
  const puedeGestionar = Boolean(user?.roles.some((rol) => rol === 'admin' || rol === 'vendedor'));

  const { vehiculos, loading, error, recargar, crear, actualizar, cambiarEstado, obtener } =
    useVehiculos();

  const [filters, setFilters] = useState<InventarioFilters>(FILTROS_VACIOS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vehiculo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [estadoLoadingId, setEstadoLoadingId] = useState<string | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalle, setDetalle] = useState<Vehiculo | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  const filtrados = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const anioDesde = aNumero(filters.anioDesde);
    const anioHasta = aNumero(filters.anioHasta);
    const precioMin = aNumero(filters.precioMin);
    const precioMax = aNumero(filters.precioMax);

    return vehiculos.filter((vehiculo) => {
      if (q) {
        const texto = `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.version} ${vehiculo.vin}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      if (filters.estado && vehiculo.estado !== filters.estado) return false;
      if (filters.condicion && vehiculo.condicion !== filters.condicion) return false;
      if (filters.stock && nivelStock(vehiculo.stock) !== filters.stock) return false;
      if (anioDesde !== undefined && vehiculo.anio < anioDesde) return false;
      if (anioHasta !== undefined && vehiculo.anio > anioHasta) return false;
      if (precioMin !== undefined && vehiculo.precio < precioMin) return false;
      if (precioMax !== undefined && vehiculo.precio > precioMax) return false;
      return true;
    });
  }, [vehiculos, filters]);

  const abrirCrear = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const abrirEditar = (vehiculo: Vehiculo) => {
    setEditing(vehiculo);
    setDialogOpen(true);
  };

  const abrirDetalle = async (vehiculo: Vehiculo) => {
    setDetalle(vehiculo);
    setDetalleOpen(true);
    setDetalleLoading(true);
    try {
      const actualizado = await obtener(vehiculo.vehiculoId);
      setDetalle(actualizado);
    } catch (detalleError) {
      toast.error(getErrorMessage(detalleError));
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleSubmit = async (input: CreateVehiculoInput | UpdateVehiculoInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await actualizar(editing.vehiculoId, input as UpdateVehiculoInput);
        toast.success('Vehículo actualizado correctamente.');
      } else {
        await crear(input as CreateVehiculoInput);
        toast.success('Vehículo registrado correctamente.');
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
      throw submitError;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCambiarEstado = async (vehiculo: Vehiculo, estado: EstadoVehiculo) => {
    if (estado === vehiculo.estado) return;
    setEstadoLoadingId(vehiculo.vehiculoId);
    try {
      await cambiarEstado(vehiculo.vehiculoId, estado);
      toast.success('Estado actualizado correctamente.');
    } catch (estadoError) {
      toast.error(getErrorMessage(estadoError));
    } finally {
      setEstadoLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title="Vehículos"
        description="Consulta la disponibilidad y mantén actualizado el inventario del concesionario."
        actions={
          puedeGestionar ? (
            <Button onClick={abrirCrear}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Registrar vehículo
            </Button>
          ) : null
        }
      />

      <InventarioFiltros filters={filters} onChange={setFilters} />

      <section className="surface-card animate-fade-in overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando inventario…
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar el inventario</AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                {error}
                <Button variant="outline" size="sm" className="w-fit" onClick={() => void recargar()}>
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
            <Car className="h-8 w-8" aria-hidden="true" />
            {vehiculos.length === 0
              ? 'Aún no hay vehículos registrados.'
              : 'No hay vehículos que coincidan con los filtros.'}
          </div>
        ) : (
          <VehiculosTable
            vehiculos={filtrados}
            estadoLoadingId={estadoLoadingId}
            puedeGestionar={puedeGestionar}
            onDetalle={abrirDetalle}
            onEditar={abrirEditar}
            onCambiarEstado={handleCambiarEstado}
          />
        )}
      </section>

      <VehiculoDetalleDialog
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        vehiculo={detalle}
        loading={detalleLoading}
      />

      {puedeGestionar && (
        <VehiculoFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          vehiculo={editing}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

export default InventoryPage;
