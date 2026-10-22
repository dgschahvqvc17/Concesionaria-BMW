import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ESTADO_CITA_LABELS,
  ESTADO_CITA_STYLES,
  TIPO_SERVICIO_LABELS,
  formatFechaHora,
} from '@/lib/citasTaller';
import type { CitaTaller } from '@/types/citaTaller';

interface HistorialServiciosTableProps {
  servicios: CitaTaller[];
  onVer: (servicio: CitaTaller) => void;
}

/** Tabla del historial de servicios de un vehículo (HU16). */
export function HistorialServiciosTable({ servicios, onVer }: HistorialServiciosTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Fecha de atención</TableHead>
          <TableHead>Servicio</TableHead>
          <TableHead>Responsable</TableHead>
          <TableHead>Repuestos</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {servicios.map((servicio) => (
          <TableRow key={servicio.citaId}>
            <TableCell className="font-medium">{servicio.numero}</TableCell>
            <TableCell>{formatFechaHora(servicio.fechaHora)}</TableCell>
            <TableCell>{TIPO_SERVICIO_LABELS[servicio.tipoServicio]}</TableCell>
            <TableCell>{servicio.mecanico?.nombre ?? '—'}</TableCell>
            <TableCell>{(servicio.repuestosUtilizados ?? []).length}</TableCell>
            <TableCell>
              <Badge className={ESTADO_CITA_STYLES[servicio.estado]}>
                {ESTADO_CITA_LABELS[servicio.estado]}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" onClick={() => onVer(servicio)}>
                Detalle
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
