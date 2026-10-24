import { useEffect, useMemo } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, Loader2 } from 'lucide-react';
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
import { formatPrecio } from '@/lib/repuestos';
import { VIGENCIA_DIAS_DEFECTO, VIGENCIA_DIAS_MAX } from '@/lib/reservas';
import type { ClienteComercial } from '@/types/clienteComercial';
import type { CreateReservaInput } from '@/types/reserva';
import type { Vehiculo } from '@/types/vehiculo';

const schema = z.object({
  clienteId: z.string().min(1, 'Selecciona un cliente.'),
  vehiculoId: z.string().min(1, 'Selecciona un vehículo disponible.'),
  monto: z.preprocess(
    (v) => (v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v),
    z.coerce
      .number({ invalid_type_error: 'El monto debe ser un número.' })
      .min(0, 'El monto no puede ser negativo.')
      .optional()
  ),
  vigenciaDias: z.coerce
    .number({ invalid_type_error: 'La vigencia debe ser un número.' })
    .int('Debe ser un número entero de días.')
    .min(1, 'La vigencia mínima es de 1 día.')
    .max(VIGENCIA_DIAS_MAX, `La vigencia máxima es de ${VIGENCIA_DIAS_MAX} días.`),
  condiciones: z.string().trim().max(1000, 'Máximo 1000 caracteres.').optional(),
});

type FormValues = z.infer<typeof schema>;

interface ReservaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: ClienteComercial[];
  vehiculos: Vehiculo[];
  onSubmit: (input: CreateReservaInput) => Promise<void>;
  loading?: boolean;
}

function getDefaults(): FormValues {
  return {
    clienteId: '',
    vehiculoId: '',
    monto: undefined,
    vigenciaDias: VIGENCIA_DIAS_DEFECTO,
    condiciones: '',
  };
}

/** Formulario de registro de reservas de vehículos (HU09). */
export function ReservaFormDialog({
  open,
  onOpenChange,
  clientes,
  vehiculos,
  onSubmit,
  loading,
}: ReservaFormDialogProps) {
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
  const seleccionado = vehiculos.find((v) => v.vehiculoId === vehiculoId) ?? null;

  const submit = handleSubmit(async (values) => {
    const payload: CreateReservaInput = {
      clienteId: values.clienteId,
      vehiculoId: values.vehiculoId,
      monto: values.monto,
      vigenciaDias: values.vigenciaDias,
      condiciones: values.condiciones?.trim() ? values.condiciones : undefined,
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
          <DialogTitle>Nueva reserva</DialogTitle>
          <DialogDescription>
            Aparta un vehículo disponible para un cliente. La unidad quedará como reservada y se liberará
            automáticamente al vencer.
          </DialogDescription>
        </DialogHeader>

        <form className="max-h-[70vh] space-y-5 overflow-y-auto pr-1" onSubmit={submit} noValidate>
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
            <Label htmlFor="vehiculoId">Vehículo</Label>
            <Controller
              control={control}
              name="vehiculoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="vehiculoId">
                    <SelectValue placeholder="Selecciona un vehículo disponible" />
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
                No hay vehículos disponibles para reservar en este momento.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto de la reserva (opcional)</Label>
              <Input
                id="monto"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                {...register('monto', { valueAsNumber: true })}
              />
              {fieldError('monto') && <p className="text-xs text-destructive">{fieldError('monto')}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vigenciaDias">Vigencia (días)</Label>
              <Input
                id="vigenciaDias"
                type="number"
                min={1}
                max={VIGENCIA_DIAS_MAX}
                {...register('vigenciaDias', { valueAsNumber: true })}
              />
              {fieldError('vigenciaDias') && <p className="text-xs text-destructive">{fieldError('vigenciaDias')}</p>}
            </div>
          </div>

          {seleccionado && (
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-4 text-sm">
              <CalendarClock className="h-5 w-5 shrink-0 text-brand-blue" aria-hidden="true" />
              <span>
                <span className="block font-medium">
                  {seleccionado.marca} {seleccionado.modelo} {seleccionado.version}
                </span>
                <span className="text-muted-foreground">
                  {seleccionado.anio} · {seleccionado.vin} · {formatPrecio(seleccionado.precio)}
                </span>
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="condiciones">Condiciones</Label>
            <Textarea
              id="condiciones"
              rows={3}
              placeholder="Depósito, forma de pago, plazos u otra información relevante (opcional)."
              {...register('condiciones')}
            />
            {fieldError('condiciones') && <p className="text-xs text-destructive">{fieldError('condiciones')}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || vehiculos.length === 0}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Registrar reserva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
