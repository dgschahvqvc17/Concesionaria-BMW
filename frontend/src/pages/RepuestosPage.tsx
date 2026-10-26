import { useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Package, PackageSearch, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { InfoTile } from '@/components/dashboard/InfoTile';
import { MovimientoDialog } from '@/components/inventory/MovimientoDialog';
import { MovimientosRecientes } from '@/components/inventory/MovimientosRecientes';
import { RepuestoDetalleDialog } from '@/components/inventory/RepuestoDetalleDialog';
import { RepuestoFormDialog } from '@/components/inventory/RepuestoFormDialog';
import { RepuestosFiltros, FILTROS_VACIOS, type RepuestosFilters } from '@/components/inventory/RepuestosFiltros';
import { RepuestosTable } from '@/components/inventory/RepuestosTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useMovimientos } from '@/hooks/useMovimientos';
import { useRepuestos } from '@/hooks/useRepuestos';
import { getErrorMessage } from '@/lib/api';
import type {
  CreateMovimientoInput,
  CreateRepuestoInput,
  Repuesto,
  TipoMovimiento,
  UpdateRepuestoInput,
} from '@/types/repuesto';

/** Página del inventario de repuestos (HU04). */
export function RepuestosPage() {
  const { user } = useAuth();
  const puedeGestionar = Boolean(
    user?.roles.some((rol) => rol === 'admin' || rol === 'vendedor' || rol === 'jefe_taller')
  );

  const { repuestos, loading, error, recargar, obtener, crear, actualizar } = useRepuestos();

  const [historialId, setHistorialId] = useState('');
  const {
    movimientos,
    loading: movLoading,
    error: movError,
    recargar: recargarMovimientos,
    registrar,
  } = useMovimientos(historialId ? { repuestoId: historialId } : {});

  const [filters, setFilters] = useState<RepuestosFilters>(FILTROS_VACIOS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Repuesto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalle, setDetalle] = useState<Repuesto | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  const [movOpen, setMovOpen] = useState(false);
  const [movRepuesto, setMovRepuesto] = useState<Repuesto | null>(null);
  const [movTipo, setMovTipo] = useState<TipoMovimiento>('entrada');
  const [movSubmitting, setMovSubmitting] = useState(false);

  const filtrados = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return repuestos.filter((repuesto) => {
      if (filters.soloReposicion && !repuesto.requiereReposicion) return false;
      if (q) {
        const texto = `${repuesto.codigo} ${repuesto.nombre} ${repuesto.categoria ?? ''}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [repuestos, filters]);

  const enReposicion = useMemo(
    () => repuestos.filter((repuesto) => repuesto.requiereReposicion).length,
    [repuestos]
  );

  const historialRepuesto = repuestos.find((repuesto) => repuesto.repuestoId === historialId) ?? null;

  const abrirCrear = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const abrirEditar = (repuesto: Repuesto) => {
    setEditing(repuesto);
    setDialogOpen(true);
  };

  const abrirDetalle = async (repuesto: Repuesto) => {
    setDetalle(repuesto);
    setDetalleOpen(true);
    setDetalleLoading(true);
    try {
      setDetalle(await obtener(repuesto.repuestoId));
    } catch (detalleError) {
      toast.error(getErrorMessage(detalleError));
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleSubmit = async (input: CreateRepuestoInput | UpdateRepuestoInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await actualizar(editing.repuestoId, input as UpdateRepuestoInput);
        toast.success('Repuesto actualizado correctamente.');
      } else {
        await crear(input as CreateRepuestoInput);
        toast.success('Repuesto registrado correctamente.');
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

  const abrirMovimiento = (repuesto: Repuesto, tipo: TipoMovimiento) => {
    setMovRepuesto(repuesto);
    setMovTipo(tipo);
    setMovOpen(true);
  };

  const handleMovimiento = async (input: CreateMovimientoInput) => {
    setMovSubmitting(true);
    try {
      await registrar(input);
      await recargar();
      toast.success(
        input.tipo === 'entrada'
          ? 'Entrada registrada correctamente.'
          : 'Salida registrada correctamente.'
      );
      setMovOpen(false);
      setMovRepuesto(null);
    } catch (movError) {
      toast.error(getErrorMessage(movError));
      throw movError;
    } finally {
      setMovSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title="Repuestos"
        description="Controla las existencias del taller, registra entradas y salidas y detecta los repuestos que requieren reposición."
        actions={
          puedeGestionar ? (
            <Button onClick={abrirCrear}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Registrar repuesto
            </Button>
          ) : null
        }
      />

      <section className="grid animate-slide-up gap-4 sm:grid-cols-2">
        <InfoTile icon={Package} label="Repuestos registrados" value={String(repuestos.length)} />
        <InfoTile
          icon={AlertTriangle}
          label="Requieren reposición"
          value={String(enReposicion)}
        />
      </section>

      <RepuestosFiltros filters={filters} onChange={setFilters} />

      <section className="surface-card animate-fade-in overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando repuestos…
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar el inventario de repuestos</AlertTitle>
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
            <PackageSearch className="h-8 w-8" aria-hidden="true" />
            {repuestos.length === 0
              ? 'Aún no hay repuestos registrados.'
              : 'No hay repuestos que coincidan con los filtros.'}
          </div>
        ) : (
          <RepuestosTable
            repuestos={filtrados}
            puedeGestionar={puedeGestionar}
            onDetalle={abrirDetalle}
            onEditar={abrirEditar}
            onMovimiento={abrirMovimiento}
            onHistorial={(repuesto) => setHistorialId(repuesto.repuestoId)}
          />
        )}
      </section>

      <RepuestoDetalleDialog
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        repuesto={detalle}
        loading={detalleLoading}
      />

      <MovimientosRecientes
        movimientos={movimientos}
        loading={movLoading}
        error={movError}
        filtroNombre={historialRepuesto?.nombre ?? null}
        onLimpiarFiltro={() => setHistorialId('')}
        onReintentar={() => void recargarMovimientos()}
      />

      {puedeGestionar && (
        <>
          <RepuestoFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            repuesto={editing}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
          <MovimientoDialog
            open={movOpen}
            onOpenChange={setMovOpen}
            repuesto={movRepuesto}
            tipoInicial={movTipo}
            submitting={movSubmitting}
            onSubmit={handleMovimiento}
          />
        </>
      )}
    </div>
  );
}

export default RepuestosPage;
