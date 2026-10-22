import { useState } from 'react';
import { History, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/PageHeader';
import { HistorialServicioDetalleDialog } from '@/components/citasTaller/HistorialServicioDetalleDialog';
import { HistorialServiciosTable } from '@/components/citasTaller/HistorialServiciosTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useHistorialServicios } from '@/hooks/useHistorialServicios';
import { getErrorMessage } from '@/lib/api';
import type { CitaTaller } from '@/types/citaTaller';

/** Página de consulta del historial de servicios de un vehículo por VIN (HU16). */
export function HistorialServiciosPage() {
  const { historial, loading, error, buscado, buscar, limpiar } = useHistorialServicios();

  const [vin, setVin] = useState('');
  const [seleccionado, setSeleccionado] = useState<CitaTaller | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);

  const handleBuscar = async () => {
    const termino = vin.trim();
    if (!termino) {
      toast.error('Escribe un VIN para buscar.');
      return;
    }
    try {
      await buscar({ vin: termino });
    } catch (searchError) {
      toast.error(getErrorMessage(searchError));
    }
  };

  const abrirDetalle = (servicio: CitaTaller) => {
    setSeleccionado(servicio);
    setDetalleOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Taller"
        title="Historial de servicios"
        description="Consulta el historial de mantenimiento y reparaciones de un vehículo buscándolo por su VIN."
      />

      <Card>
        <CardHeader>
          <CardTitle>Buscar vehículo</CardTitle>
          <CardDescription>
            Ingresa el VIN del vehículo para ver los servicios registrados, sus fechas, diagnósticos,
            responsable y repuestos utilizados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="VIN del vehículo…"
              value={vin}
              onChange={(event) => setVin(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleBuscar();
              }}
            />
            <Button onClick={() => void handleBuscar()} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              Buscar
            </Button>
            {buscado && (
              <Button
                variant="outline"
                onClick={() => {
                  setVin('');
                  limpiar();
                }}
              >
                Limpiar
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>No se pudo consultar el historial</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {historial && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
                <p className="font-semibold">
                  {historial.vehiculo.marca} {historial.vehiculo.modelo}{' '}
                  {historial.vehiculo.version}
                </p>
                <p className="text-muted-foreground">
                  VIN: {historial.vehiculo.vin} · Año: {historial.vehiculo.anio}
                  {historial.vehiculo.color ? ` · Color: ${historial.vehiculo.color}` : ''}
                </p>
                <p className="text-muted-foreground">
                  {historial.total} servicio(s) registrado(s).
                </p>
              </div>

              {historial.servicios.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
                  <History className="h-8 w-8" aria-hidden="true" />
                  Este vehículo aún no tiene servicios registrados.
                </div>
              ) : (
                <HistorialServiciosTable servicios={historial.servicios} onVer={abrirDetalle} />
              )}
            </div>
          )}

          {!buscado && !loading && (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
              <History className="h-8 w-8" aria-hidden="true" />
              Busca un vehículo por su VIN para ver su historial de servicios.
            </div>
          )}
        </CardContent>
      </Card>

      <HistorialServicioDetalleDialog
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        servicio={seleccionado}
      />
    </div>
  );
}

export default HistorialServiciosPage;
