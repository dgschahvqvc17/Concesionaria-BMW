import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ESTADO_COTIZACION_LABELS, ESTADO_COTIZACION_STYLES } from '@/lib/cotizaciones';
import { formatFecha, formatPrecio } from '@/lib/repuestos';
import type { Cotizacion } from '@/types/cotizacion';

interface CotizacionesTableProps {
  cotizaciones: Cotizacion[];
  onVer: (cotizacion: Cotizacion) => void;
}

/** Tabla del listado de cotizaciones (HU08). */
export function CotizacionesTable({ cotizaciones, onVer }: CotizacionesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Vehículos</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Vence</TableHead>
          <TableHead>Creada</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cotizaciones.map((cotizacion) => (
          <TableRow key={cotizacion.cotizacionId}>
            <TableCell className="font-medium">{cotizacion.numero}</TableCell>
            <TableCell>
              {cotizacion.cliente.nombres} {cotizacion.cliente.apellidos}
            </TableCell>
            <TableCell>{cotizacion.items.length}</TableCell>
            <TableCell>{formatPrecio(cotizacion.total)}</TableCell>
            <TableCell>
              <Badge className={ESTADO_COTIZACION_STYLES[cotizacion.estado]}>
                {ESTADO_COTIZACION_LABELS[cotizacion.estado]}
              </Badge>
            </TableCell>
            <TableCell>{formatFecha(cotizacion.fechaVencimiento)}</TableCell>
            <TableCell>{formatFecha(cotizacion.createdAt)}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" onClick={() => onVer(cotizacion)}>
                Ver
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
