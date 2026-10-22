import { useState } from 'react';
import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarRange,
  ClipboardList,
  Loader2,
  Package,
  Percent,
  RefreshCw,
  ShoppingCart,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/PageHeader';
import { BarChart } from '@/components/reportes/BarChart';
import { DonutChart } from '@/components/reportes/DonutChart';
import { KpiCard } from '@/components/reportes/KpiCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useReportes } from '@/hooks/useReportes';
import { getErrorMessage } from '@/lib/api';
import { formatPrecio } from '@/lib/repuestos';
import {
  ESTADO_CITA_LABELS,
  ESTADO_COTIZACION_LABELS,
  ESTADO_VEHICULO_LABELS,
  aSerie,
  etiquetaMes,
  fechaIngresadaAInput,
} from '@/lib/reportes';
import type { ReporteFiltro } from '@/types/reporte';

/** Página de reportes de gestión: inventario, ventas, clientes y taller (HU17). */
export function ReportesPage() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [filtro, setFiltro] = useState<ReporteFiltro>({});

  const { reporte, loading, error, recargar } = useReportes(filtro);

  const aplicarFiltro = async () => {
    if (desde && hasta && desde > hasta) {
      toast.error('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      return;
    }
    try {
      await recargar({
        fechaDesde: fechaIngresadaAInput(desde),
        fechaHasta: fechaIngresadaAInput(hasta, true),
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const limpiarFiltro = async () => {
    setDesde('');
    setHasta('');
    setFiltro({});
    try {
      await recargar({});
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const aplicarDesdeInput = (valor: string) => {
    setDesde(valor);
    setFiltro({ fechaDesde: fechaIngresadaAInput(valor), fechaHasta: fechaIngresadaAInput(hasta, true) });
  };

  const aplicarHastaInput = (valor: string) => {
    setHasta(valor);
    setFiltro({ fechaDesde: fechaIngresadaAInput(desde), fechaHasta: fechaIngresadaAInput(valor, true) });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Reportes de gestión"
        description="Indicadores de inventario, ventas, cotizaciones, clientes y taller para la toma de decisiones. Filtra por rango de fechas los reportes por período."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <CalendarRange className="h-4 w-4 text-brand-blue-deep" aria-hidden="true" />
            <CardTitle className="text-lg">Rango de fechas</CardTitle>
          </div>
          <CardDescription>
            Los reportes de ventas, cotizaciones y taller se agregan según el rango indicado. Si lo
            dejas vacío se consideran todos los registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="fecha-desde">Desde</Label>
              <Input
                id="fecha-desde"
                type="date"
                value={desde}
                onChange={(event) => aplicarDesdeInput(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha-hasta">Hasta</Label>
              <Input
                id="fecha-hasta"
                type="date"
                value={hasta}
                onChange={(event) => aplicarHastaInput(event.target.value)}
              />
            </div>
            <Button onClick={() => void aplicarFiltro()} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              )}
              Aplicar
            </Button>
            <Button variant="outline" onClick={() => void limpiarFiltro()} disabled={loading}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar los reportes</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !reporte && (
        <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Generando reportes…
        </div>
      )}

      {reporte && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={BadgeDollarSign}
              label="Ventas del período"
              value={formatPrecio(reporte.ventas.totalFinal)}
              hint={`${reporte.ventas.total} venta(s) · ticket ${formatPrecio(reporte.ventas.ticketPromedio)}`}
            />
            <KpiCard
              icon={ShoppingCart}
              label="Cotizaciones"
              value={String(reporte.cotizaciones.total)}
              hint={`Importe ${formatPrecio(reporte.cotizaciones.importeTotal)}`}
            />
            <KpiCard
              icon={Wallet}
              label="Valor del inventario"
              value={formatPrecio(reporte.inventario.valorInventario)}
              hint={`${reporte.inventario.total} vehículo(s)`}
            />
            <KpiCard
              icon={Wrench}
              label="Órdenes finalizadas"
              value={String(reporte.taller.ordenesFinalizadas)}
              hint={`${reporte.taller.total} cita(s) en el período`}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventario por estado</CardTitle>
                <CardDescription>Distribución de vehículos según su disponibilidad.</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart datos={aSerie(reporte.inventario.porEstado, ESTADO_VEHICULO_LABELS)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cotizaciones por estado</CardTitle>
                <CardDescription>Estado actual de las cotizaciones del período.</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart
                  datos={aSerie(reporte.cotizaciones.porEstado, ESTADO_COTIZACION_LABELS)}
                />
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ventas por mes</CardTitle>
              <CardDescription>
                Importe total vendido en cada mes del período seleccionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                datos={reporte.ventas.porMes.map((punto) => ({
                  etiqueta: etiquetaMes(punto.mes),
                  valor: punto.importe,
                }))}
                formatearValor={formatPrecio}
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Total lista</p>
                  <p className="text-lg font-semibold">{formatPrecio(reporte.ventas.totalLista)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Descuentos</p>
                  <p className="text-lg font-semibold">{formatPrecio(reporte.ventas.totalDescuento)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Total final</p>
                  <p className="text-lg font-semibold">{formatPrecio(reporte.ventas.totalFinal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Citas del taller por estado</CardTitle>
                <CardDescription>
                  {reporte.taller.repuestosConsumidos} repuesto(s) utilizados en las órdenes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  datos={aSerie(reporte.taller.porEstado, ESTADO_CITA_LABELS)}
                  color="#0a4c93"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Clientes por estado de seguimiento</CardTitle>
                <CardDescription>
                  {reporte.clientes.total} cliente(s) comerciales registrados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart datos={aSerie(reporte.clientes.porEstado)} color="#3b8bff" />
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
                <CardTitle className="text-lg">Repuestos con existencias bajas</CardTitle>
              </div>
              <CardDescription>
                {reporte.repuestos.bajos.length} repuesto(s) en o por debajo del mínimo · Valor del
                inventario de repuestos: {formatPrecio(reporte.repuestos.valorInventario)}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reporte.repuestos.bajos.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
                  <Package className="h-7 w-7" aria-hidden="true" />
                  No hay repuestos con existencias bajas.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Repuesto</TableHead>
                      <TableHead className="text-right">Existencia</TableHead>
                      <TableHead className="text-right">Mínimo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporte.repuestos.bajos.map((repuesto) => (
                      <TableRow key={repuesto.repuestoId}>
                        <TableCell className="font-medium">{repuesto.codigo}</TableCell>
                        <TableCell>{repuesto.nombre}</TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">
                          {repuesto.cantidad}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {repuesto.cantidadMinima}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
              Generado: {new Date(reporte.generadoEn).toLocaleString('es-BO')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5" aria-hidden="true" />
              Descuento medio:{' '}
              {reporte.ventas.totalLista > 0
                ? `${Math.round((reporte.ventas.totalDescuento / reporte.ventas.totalLista) * 100)} %`
                : '0 %'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {reporte.clientes.total} cliente(s)
            </span>
          </p>
        </>
      )}
    </div>
  );
}

export default ReportesPage;
