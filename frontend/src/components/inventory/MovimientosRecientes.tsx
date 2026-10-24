import { Loader2, PackageSearch } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatFecha, TIPO_MOVIMIENTO_LABELS, TIPO_MOVIMIENTO_STYLES } from '@/lib/repuestos';
import type { Movimiento } from '@/types/repuesto';

interface MovimientosRecientesProps {
  movimientos: Movimiento[];
  loading: boolean;
  error: string | null;
  /** Nombre del repuesto cuando la lista está filtrada por historial. */
  filtroNombre?: string | null;
  onLimpiarFiltro: () => void;
  onReintentar: () => void;
}

/** Tabla con el historial de movimientos de inventario (HU04). */
export function MovimientosRecientes({
  movimientos,
  loading,
  error,
  filtroNombre,
  onLimpiarFiltro,
  onReintentar,
}: MovimientosRecientesProps) {
  return (
    <section className="surface-card animate-fade-in overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Movimientos de inventario</h2>
          <p className="text-xs text-muted-foreground">
            {filtroNombre ? `Historial de ${filtroNombre}` : 'Últimas entradas y salidas registradas'}
          </p>
        </div>
        {filtroNombre && (
          <Button variant="ghost" size="sm" onClick={onLimpiarFiltro}>
            Ver todos los movimientos
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Cargando movimientos…
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 p-10 text-center text-sm text-muted-foreground">
          {error}
          <Button variant="outline" size="sm" onClick={onReintentar}>
            Reintentar
          </Button>
        </div>
      ) : movimientos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
          <PackageSearch className="h-8 w-8" aria-hidden="true" />
          {filtroNombre
            ? 'Este repuesto todavía no tiene movimientos registrados.'
            : 'Aún no se registraron movimientos de inventario.'}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Repuesto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead>Resultante</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Usuario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimientos.map((movimiento) => {
              return (
                <TableRow key={movimiento.movimientoId}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatFecha(movimiento.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{movimiento.repuestoNombre}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {repuestoCodigo(movimiento)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={TIPO_MOVIMIENTO_STYLES[movimiento.tipo]}>
                      {TIPO_MOVIMIENTO_LABELS[movimiento.tipo]}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`font-medium ${movimiento.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {movimiento.tipo === 'entrada' ? '+' : '−'}
                    {movimiento.cantidad}
                  </TableCell>
                  <TableCell>{movimiento.cantidadResultante}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {movimiento.motivo || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{movimiento.usuarioNombre ?? '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

function repuestoCodigo(movimiento: Movimiento): string {
  return movimiento.repuestoCodigo ?? '';
}
