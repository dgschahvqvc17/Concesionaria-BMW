import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ESTADO_CITA_LABELS,
  ESTADO_CITA_STYLES,
  TIPO_SERVICIO_LABELS,
  etiquetaAsignacion,
  formatFechaHora,
  rangoHorario,
} from '@/lib/citasTaller';
import type { CitaTaller } from '@/types/citaTaller';

interface CitasTallerTableProps {
  citas: CitaTaller[];
  onVer: (cita: CitaTaller) => void;
}

/** Tabla del listado de citas del taller (HU13 + HU14). */
export function CitasTallerTable({ citas, onVer }: CitasTallerTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Vehículo</TableHead>
          <TableHead>Servicio</TableHead>
          <TableHead>Mecánico</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Horario</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {citas.map((cita) => (
          <TableRow key={cita.citaId}>
            <TableCell className="font-medium">{cita.numero}</TableCell>
            <TableCell>
              {cita.cliente ? `${cita.cliente.nombres} ${cita.cliente.apellidos}`.trim() : '—'}
            </TableCell>
            <TableCell>
              {cita.vehiculo.marca} {cita.vehiculo.modelo}
            </TableCell>
            <TableCell>{TIPO_SERVICIO_LABELS[cita.tipoServicio]}</TableCell>
            <TableCell>{etiquetaAsignacion(cita)}</TableCell>
            <TableCell>{formatFechaHora(cita.fechaHora)}</TableCell>
            <TableCell>{rangoHorario(cita)}</TableCell>
            <TableCell>
              <Badge className={ESTADO_CITA_STYLES[cita.estado]}>{ESTADO_CITA_LABELS[cita.estado]}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" onClick={() => onVer(cita)}>
                Ver
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
