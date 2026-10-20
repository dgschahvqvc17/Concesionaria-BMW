import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ESTADO_PRUEBA_LABELS, ESTADO_PRUEBA_STYLES, formatFechaHora, rangoHorario } from '@/lib/pruebasManejo';
import type { PruebaManejo } from '@/types/pruebaManejo';

interface PruebasManejoTableProps {
  pruebas: PruebaManejo[];
  onVer: (prueba: PruebaManejo) => void;
}

/** Tabla del listado de pruebas de manejo (HU11). */
export function PruebasManejoTable({ pruebas, onVer }: PruebasManejoTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Solicitante</TableHead>
          <TableHead>Vehículo</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Horario</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pruebas.map((prueba) => (
          <TableRow key={prueba.pruebaId}>
            <TableCell className="font-medium">{prueba.numero}</TableCell>
            <TableCell>{prueba.contacto.nombre}</TableCell>
            <TableCell>
              {prueba.vehiculo.marca} {prueba.vehiculo.modelo}
            </TableCell>
            <TableCell>{formatFechaHora(prueba.fechaHora)}</TableCell>
            <TableCell>{rangoHorario(prueba)}</TableCell>
            <TableCell>
              <Badge className={ESTADO_PRUEBA_STYLES[prueba.estado]}>
                {ESTADO_PRUEBA_LABELS[prueba.estado]}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" onClick={() => onVer(prueba)}>
                Ver
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
