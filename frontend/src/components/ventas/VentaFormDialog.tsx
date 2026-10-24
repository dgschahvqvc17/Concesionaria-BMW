import { useEffect, useMemo } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getFieldErrors } from '@/lib/api';
import { DESCUENTO_MAXIMO, calcularImportes, etiquetaEstadoVehiculo } from '@/lib/ventas';
import { formatPrecio } from '@/lib/repuestos';
import type { ClienteComercial } from '@/types/clienteComercial';
import type { CreateVentaInput } from '@/types/venta';
import type { Vehiculo } from '@/types/vehiculo';

const schema = z.object({
  clienteId: z.string().min(1, 'Selecciona un cliente.'),
  vehiculoId: z.string().min(1, 'Selecciona un vehículo.'),
  descuentoPorcentaje: z.coerce
    .number({ invalid_type_error: 'El descuento debe ser un número.' })
    .min(0, 'El descuento no puede ser negativo.')
    .max(DESCUENTO_MAXIMO, `El descuento no puede superar el ${DESCUENTO_MAXIMO}%.`),
  observaciones: z.string().trim().max(1000, 'Máximo 1000 caracteres.').optional(),
});

type FormValues = z.infer<typeof schema>;

interface VentaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: ClienteComercial[];
  vehiculos: Vehiculo[];
  onSubmit: (input: CreateVentaInput) => Promise<void>;
  loading?: boolean;
}

function getDefaults(): FormValues {
  return {
    clienteId: '',
    vehiculoId: '',
    descuentoPorcentaje: 0,
    observaciones: '',
  };
}

/** Formulario de registro de ventas de vehículos (HU10). */
export function VentaFormDialog({
  open,
  onOpenChange,
  clientes,
  vehiculos,
  onSubmit,
  loading,
}: VentaFormDialogProps) {
  const resolver = useMemo(() => zodResolver(schema) as Resolver<FormValues>, []);
  const form = useForm<FormValues>({ resolver, defaultValues: getDefaults() });
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) reset(getDefaults());
  }, [open, reset]);

  const vehiculoId = watch('vehiculoId');
  const descuento = watch('descuentoPorcentaje');
  const seleccionado = vehiculos.find((v) => v.vehiculoId === vehiculoId) ?? null;

  const resumen = useMemo(() => {
    const precioLista = seleccionado?.precio ?? 0;
    const porcentaje = Number.isFinite(descuento) ? Number(descuento) : 0;
    return { precioLista, ...calcularImportes(precioLista, porcentaje) };
  }, [seleccionado, descuento]);

  const submit = handleSubmit(async (values) => {
    const payload: CreateVentaInput = {
      clienteId: values.clienteId,
      vehiculoId: values.vehiculoId,
      descuentoPorcentaje: values.descuentoPorcentaje,
      observaciones: values.observaciones?.trim() ? values.observaciones : undefined,
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      (Object.keys(fieldErrors) as Array<keyof FormValues>).forEach((field) => {
        setError(field, { type: 'server', message: fieldErrors[field] });
      });
    }
  });

  const fieldError = (name: keyof FormValues) => errors[name]?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva venta</DialogTitle>
          <DialogDescription>
            Registra la operación comercial. El vehículo pasará a estado vendido y quedará en el historial
            de ventas.
          </DialogDescription>
        </DialogHeader>

        <form className="max-h-[70vh] space-y-5 overflow-y-auto pr-1" onSubmit={submit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clienteId">Cliente</Label>
              <Controller
                control={control}
                name="clienteId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="clienteId">
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.clienteId} value={cliente.clienteId}>
                          {cliente.nombres} {cliente.apellidos} — {cliente.documento}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {fieldError('clienteId') && <p className="text-xs text-destructive">{fieldError('clienteId')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descuentoPorcentaje">Descuento autorizado (%)</Label>
              <Input
                id="descuentoPorcentaje"
                type="number"
                min={0}
                max={DESCUENTO_MAXIMO}
                step="0.5"
                {...register('descuentoPorcentaje', { valueAsNumber: true })}
              />
              {fieldError('descuentoPorcentaje') && (
                <p className="text-xs text-destructive">{fieldError('descuentoPorcentaje')}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehiculoId">Vehículo</Label>
            <Controller
              control={control}
              name="vehiculoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="vehiculoId">
                    <SelectValue placeholder="Selecciona un vehículo disponible o reservado" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehiculos.map((vehiculo) => (
                      <SelectItem key={vehiculo.vehiculoId} value={vehiculo.vehiculoId}>
                        {vehiculo.marca} {vehiculo.modelo} {vehiculo.version} — {formatPrecio(vehiculo.precio)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {fieldError('vehiculoId') && <p className="text-xs text-destructive">{fieldError('vehiculoId')}</p>}
            {vehiculos.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No hay vehículos disponibles ni reservados para vender en este momento.
              </p>
            )}
          </div>

          {seleccionado && (
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-4 text-sm">
              <CalendarCheck className="h-5 w-5 shrink-0 text-brand-blue" aria-hidden="true" />
              <span>
                <span className="block font-medium">
                  {seleccionado.marca} {seleccionado.modelo} {seleccionado.version}
                </span>
                <span className="text-muted-foreground">
                  {seleccionado.anio} · {seleccionado.vin} · {etiquetaEstadoVehiculo(seleccionado)}
                </span>
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              rows={3}
              placeholder="Forma de pago, condiciones de entrega u otra información relevante (opcional)."
              {...register('observaciones')}
            />
            {fieldError('observaciones') && (
              <p className="text-xs text-destructive">{fieldError('observaciones')}</p>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Precio de lista</span>
              <span className="font-medium">{formatPrecio(resumen.precioLista)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">
                Descuento ({Number.isFinite(descuento) ? descuento : 0}%)
              </span>
              <span className="font-medium">- {formatPrecio(resumen.descuentoMonto)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-base">
              <span className="font-semibold">Precio final</span>
              <span className="font-semibold">{formatPrecio(resumen.precioFinal)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || vehiculos.length === 0}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Registrar venta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
