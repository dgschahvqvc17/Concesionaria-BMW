import { AlertTriangle, Eye, History, Minus, Pencil, Plus } from 'lucide-react';

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
import { formatPrecio } from '@/lib/repuestos';
import type { Repuesto } from '@/types/repuesto';

interface RepuestosTableProps {
  repuestos: Repuesto[];
  puedeGestionar: boolean;
  onDetalle: (repuesto: Repuesto) => void;
  onEditar: (repuesto: Repuesto) => void;
  onMovimiento: (repuesto: Repuesto, tipo: 'entrada' | 'salida') => void;
  onHistorial: (repuesto: Repuesto) => void;
}

/** Tabla del inventario de repuestos con existencias y estado de reposición. */
export function RepuestosTable({
  repuestos,
  puedeGestionar,
  onDetalle,
  onEditar,
  onMovimiento,
  onHistorial,
}: RepuestosTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Repuesto</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Existencias</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {repuestos.map((repuesto) => (
          <TableRow key={repuesto.repuestoId}>
            <TableCell className="font-mono text-xs font-medium">{repuesto.codigo}</TableCell>
            <TableCell>
              <div className="font-medium">{repuesto.nombre}</div>
              {repuesto.descripcion && (
                <div className="max-w-xs truncate text-xs text-muted-foreground">
                  {repuesto.descripcion}
                </div>
              )}
            </TableCell>
            <TableCell>
              {repuesto.categoria ? (
                <Badge variant="secondary">{repuesto.categoria}</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">Sin categoría</span>
              )}
            </TableCell>
            <TableCell className="font-medium">{formatPrecio(repuesto.precio)}</TableCell>
            <TableCell>
              <span className="font-medium">{repuesto.cantidad}</span>
              <span className="text-xs text-muted-foreground"> / mín. {repuesto.cantidadMinima}</span>
            </TableCell>
            <TableCell>
              {repuesto.requiereReposicion ? (
                <Badge className="gap-1 border-transparent bg-amber-500/10 text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  Reposición
                </Badge>
              ) : (
                <Badge variant="secondary">Disponible</Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => onDetalle(repuesto)}>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Ver</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onHistorial(repuesto)}>
                  <History className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Historial</span>
                </Button>
                {puedeGestionar && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMovimiento(repuesto, 'entrada')}
                      title="Registrar entrada"
                    >
                      <Plus className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      <span className="sr-only">Entrada</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMovimiento(repuesto, 'salida')}
                      title="Registrar salida"
                    >
                      <Minus className="h-4 w-4 text-rose-600" aria-hidden="true" />
                      <span className="sr-only">Salida</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEditar(repuesto)}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
