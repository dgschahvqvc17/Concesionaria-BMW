import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Search } from 'lucide-react';
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
import { DESCUENTO_MAXIMO, VIGENCIA_DIAS_DEFECTO, calcularImportes } from '@/lib/cotizaciones';
import { formatPrecio } from '@/lib/repuestos';
import { cn } from '@/lib/utils';
import type { ClienteComercial } from '@/types/clienteComercial';
import type { CreateCotizacionInput } from '@/types/cotizacion';
import type { Vehiculo } from '@/types/vehiculo';

const schema = z.object({
  clienteId: z.string().min(1, 'Selecciona un cliente.'),
  vehiculoIds: z.array(z.string()).min(1, 'Selecciona al menos un vehículo.'),
  descuentoPorcentaje: z.coerce
    .number({ invalid_type_error: 'El descuento debe ser un número.' })
    .min(0, 'El descuento no puede ser negativo.')
    .max(DESCUENTO_MAXIMO, `El descuento no puede superar el ${DESCUENTO_MAXIMO}%.`),
  vigenciaDias: z.coerce
    .number({ invalid_type_error: 'La vigencia debe ser un número.' })
    .int('Debe ser un número entero de días.')
    .min(1, 'La vigencia mínima es de 1 día.')
    .max(90, 'La vigencia máxima es de 90 días.'),
  observaciones: z.string().trim().max(1000, 'Máximo 1000 caracteres.').optional(),
});

type FormValues = z.infer<typeof schema>;

interface CotizacionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: ClienteComercial[];
  vehiculos: Vehiculo[];
  onSubmit: (input: CreateCotizacionInput) => Promise<void>;
  loading?: boolean;
}

function getDefaults(): FormValues {
  return {
    clienteId: '',
    vehiculoIds: [],
    descuentoPorcentaje: 0,
    vigenciaDias: VIGENCIA_DIAS_DEFECTO,
    observaciones: '',
  };
}

/** Formulario de creación de cotizaciones (HU08). */
export function CotizacionFormDialog({
  open,
  onOpenChange,
  clientes,
  vehiculos,
  onSubmit,
  loading,
}: CotizacionFormDialogProps) {
  const resolver = useMemo(() => zodResolver(schema) as Resolver<FormValues>, []);
  const form = useForm<FormValues>({ resolver, defaultValues: getDefaults() });
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = form;

  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (open) {
      reset(getDefaults());
      setBusqueda('');
    }
  }, [open, reset]);

  const seleccionados = watch('vehiculoIds') ?? [];
  const descuento = watch('descuentoPorcentaje');

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return vehiculos;
    return vehiculos.filter((v) =>
      `${v.marca} ${v.modelo} ${v.version} ${v.vin}`.toLowerCase().includes(q)
    );
  }, [vehiculos, busqueda]);

  const resumen = useMemo(() => {
    const subtotal = vehiculos
      .filter((v) => seleccionados.includes(v.vehiculoId))
      .reduce((acc, v) => acc + v.precio, 0);
    const porcentaje = Number.isFinite(descuento) ? Number(descuento) : 0;
    return { subtotal, ...calcularImportes(subtotal, porcentaje) };
  }, [vehiculos, seleccionados, descuento]);

  const alternarVehiculo = (vehiculoId: string) => {
    const siguiente = seleccionados.includes(vehiculoId)
      ? seleccionados.filter((id) => id !== vehiculoId)
      : [...seleccionados, vehiculoId];
    setValue('vehiculoIds', siguiente, { shouldValidate: true, shouldDirty: true });
  };

  const submit = handleSubmit(async (values) => {
    const payload: CreateCotizacionInput = {
      clienteId: values.clienteId,
      vehiculoIds: values.vehiculoIds,
      descuentoPorcentaje: values.descuentoPorcentaje,
      vigenciaDias: values.vigenciaDias,
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nueva cotización</DialogTitle>
          <DialogDescription>
            Selecciona un cliente y los vehículos a cotizar. Los importes se calculan automáticamente.
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
              {fieldError('clienteId') && (
                <p className="text-xs text-destructive">{fieldError('clienteId')}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="descuentoPorcentaje">Descuento (%)</Label>
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
              <div className="space-y-2">
                <Label htmlFor="vigenciaDias">Vigencia (días)</Label>
                <Input
                  id="vigenciaDias"
                  type="number"
                  min={1}
                  max={90}
                  {...register('vigenciaDias', { valueAsNumber: true })}
                />
                {fieldError('vigenciaDias') && (
                  <p className="text-xs text-destructive">{fieldError('vigenciaDias')}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Vehículos</Label>
              <div className="relative w-full sm:w-64">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  className="pl-9"
                  placeholder="Buscar vehículo…"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                />
              </div>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border/60 p-2">
              {filtrados.map((vehiculo) => {
                const activo = seleccionados.includes(vehiculo.vehiculoId);
                return (
                  <label
                    key={vehiculo.vehiculoId}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
                      activo
                        ? 'border-brand-blue/60 bg-brand-blue-ice/60'
                        : 'border-transparent hover:bg-muted/60'
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-blue"
                      checked={activo}
                      onChange={() => alternarVehiculo(vehiculo.vehiculoId)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {vehiculo.marca} {vehiculo.modelo} {vehiculo.version}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {vehiculo.anio} · {vehiculo.vin} · {vehiculo.estado}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold">{formatPrecio(vehiculo.precio)}</span>
                  </label>
                );
              })}
              {filtrados.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">
                  No hay vehículos disponibles para cotizar.
                </p>
              )}
            </div>
            {fieldError('vehiculoIds') && (
              <p className="text-xs text-destructive">{fieldError('vehiculoIds')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              rows={3}
              placeholder="Condiciones, forma de pago u otra información relevante (opcional)."
              {...register('observaciones')}
            />
            {fieldError('observaciones') && (
              <p className="text-xs text-destructive">{fieldError('observaciones')}</p>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Vehículos seleccionados</span>
              <span className="font-medium">{seleccionados.length}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatPrecio(resumen.subtotal)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">
                Descuento ({Number.isFinite(descuento) ? descuento : 0}%)
              </span>
              <span className="font-medium">- {formatPrecio(resumen.descuentoMonto)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-base">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{formatPrecio(resumen.total)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Generar cotización
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
