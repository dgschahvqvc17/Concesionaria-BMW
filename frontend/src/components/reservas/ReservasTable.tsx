import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatFecha, formatPrecio } from '@/lib/repuestos';
import { ESTADO_RESERVA_LABELS, ESTADO_RESERVA_STYLES } from '@/lib/reservas';
import type { Reserva } from '@/types/reserva';

interface ReservasTableProps {
  reservas: Reserva[];
  onVer: (reserva: Reserva) => void;
}

/** Tabla del listado de reservas (HU09). */
export function ReservasTable({ reservas, onVer }: ReservasTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Vehículo</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Vence</TableHead>
          <TableHead>Creada</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservas.map((reserva) => (
          <TableRow key={reserva.reservaId}>
            <TableCell className="font-medium">{reserva.numero}</TableCell>
            <TableCell>
              {reserva.cliente.nombres} {reserva.cliente.apellidos}
            </TableCell>
            <TableCell>
              {reserva.vehiculo.marca} {reserva.vehiculo.modelo}
            </TableCell>
            <TableCell>{reserva.monto != null ? formatPrecio(reserva.monto) : '—'}</TableCell>
            <TableCell>
              <Badge className={ESTADO_RESERVA_STYLES[reserva.estado]}>
                {ESTADO_RESERVA_LABELS[reserva.estado]}
              </Badge>
            </TableCell>
            <TableCell>{formatFecha(reserva.fechaVencimiento)}</TableCell>
            <TableCell>{formatFecha(reserva.createdAt)}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" onClick={() => onVer(reserva)}>
                Ver
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
