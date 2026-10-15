import { ImageOff, Loader2, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CONDICION_LABELS, ESTADOS, ESTADO_LABELS, ESTADO_STYLES, formatKilometraje, formatPrecio } from '@/lib/vehiculos';
import type { EstadoVehiculo, Vehiculo } from '@/types/vehiculo';

interface VehiculosTableProps {
  vehiculos: Vehiculo[];
  estadoLoadingId: string | null;
  puedeGestionar: boolean;
  onEditar: (vehiculo: Vehiculo) => void;
  onCambiarEstado: (vehiculo: Vehiculo, estado: EstadoVehiculo) => void;
}

/** Tabla del inventario de vehículos. */
export function VehiculosTable({
  vehiculos,
  estadoLoadingId,
  puedeGestionar,
  onEditar,
  onCambiarEstado,
}: VehiculosTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">Foto</TableHead>
          <TableHead>Vehículo</TableHead>
          <TableHead>Año</TableHead>
          <TableHead>Km</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Estado</TableHead>
          {puedeGestionar && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehiculos.map((vehiculo) => {
          const portada = vehiculo.fotos[0]?.url;
          const toggling = estadoLoadingId === vehiculo.vehiculoId;

          return (
            <TableRow key={vehiculo.vehiculoId}>
              <TableCell>
                {portada ? (
                  <img
                    src={portada}
                    alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                    className="h-12 w-16 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-16 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <ImageOff className="h-4 w-4" aria-hidden="true" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {vehiculo.marca} {vehiculo.modelo}
                </div>
                <div className="text-xs text-muted-foreground">
                  {vehiculo.version} · {vehiculo.color} · {CONDICION_LABELS[vehiculo.condicion]}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">VIN {vehiculo.vin}</div>
              </TableCell>
              <TableCell>{vehiculo.anio}</TableCell>
              <TableCell>{formatKilometraje(vehiculo.kilometraje)}</TableCell>
              <TableCell className="font-medium">{formatPrecio(vehiculo.precio)}</TableCell>
              <TableCell>
                {puedeGestionar ? (
                  <Select
                    value={vehiculo.estado}
                    onValueChange={(value) => onCambiarEstado(vehiculo, value as EstadoVehiculo)}
                    disabled={toggling}
                  >
                    <SelectTrigger className="h-9 w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {ESTADO_LABELS[estado]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={ESTADO_STYLES[vehiculo.estado]}>{ESTADO_LABELS[vehiculo.estado]}</Badge>
                )}
              </TableCell>
              {puedeGestionar && (
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onEditar(vehiculo)} disabled={toggling}>
                    {toggling ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
