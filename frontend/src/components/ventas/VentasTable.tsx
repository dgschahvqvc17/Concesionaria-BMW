import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatFecha, formatPrecio } from '@/lib/repuestos';
import type { Venta } from '@/types/venta';

interface VentasTableProps {
  ventas: Venta[];
  onVer: (venta: Venta) => void;
}

/** Tabla del historial de ventas (HU10). */
export function VentasTable({ ventas, onVer }: VentasTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Vehículo</TableHead>
          <TableHead>Precio final</TableHead>
          <TableHead>Fecha de venta</TableHead>
          <TableHead>Registrada por</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ventas.map((venta) => (
          <TableRow key={venta.ventaId}>
            <TableCell className="font-medium">{venta.numero}</TableCell>
            <TableCell>
              {venta.cliente.nombres} {venta.cliente.apellidos}
            </TableCell>
            <TableCell>
              {venta.vehiculo.marca} {venta.vehiculo.modelo} {venta.vehiculo.version}
            </TableCell>
            <TableCell className="font-semibold">{formatPrecio(venta.precioFinal)}</TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span>{formatFecha(venta.fechaVenta)}</span>
                {venta.numeroReserva && (
                  <Badge className="w-fit border-transparent bg-brand-blue-ice text-brand-blue">
                    {venta.numeroReserva}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{venta.createdByName ?? '—'}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" onClick={() => onVer(venta)}>
                Ver
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
