import { useEffect, useMemo } from 'react';
import { useForm, Controller, type Path, type Resolver } from 'react-hook-form';
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
import {
  DURACION_DEFECTO,
  DURACION_MAX,
  DURACION_MIN,
  HORARIO_FIN,
  HORARIO_INICIO,
  PASO_MINUTOS,
  TIPOS_SERVICIO,
  TIPO_SERVICIO_LABELS,
  fechaHoraPorDefecto,
  validarFechaCita,
} from '@/lib/citasTaller';
import { formatPrecio } from '@/lib/repuestos';
import type { ClienteComercial } from '@/types/clienteComercial';
import type { CreateCitaTallerInput, TipoServicioCita } from '@/types/citaTaller';
import type { Vehiculo } from '@/types/vehiculo';

const schema = z.object({
  vehiculoId: z.string().min(1, 'Selecciona un vehículo.'),
  clienteId: z.string().min(1, 'Selecciona un cliente.'),
  tipoServicio: z.enum(TIPOS_SERVICIO as [TipoServicioCita, ...TipoServicioCita[]], {
    errorMap: () => ({ message: 'Selecciona el tipo de servicio.' }),
  }),
  fechaHora: z.string().min(1, 'Elige la fecha y hora de la cita.').superRefine((valor, contexto) => {
    const error = validarFechaCita(valor);
    if (error) contexto.addIssue({ code: z.ZodIssueCode.custom, message: error });
  }),
  duracionMinutos: z.coerce
    .number({ invalid_type_error: 'La duración debe ser un número.' })
    .int('La duración debe ser un número entero de minutos.')
    .min(DURACION_MIN, `La duración mínima es de ${DURACION_MIN} minutos.`)
    .max(DURACION_MAX, `La duración máxima es de ${DURACION_MAX} minutos.`),
  observaciones: z.string().trim().max(1000, 'Máximo 1000 caracteres.').optional(),
});

type FormValues = z.infer<typeof schema>;

/** Equivalencia de campos de validación del backend a rutas del formulario. */
const RUTAS_SERVIDOR: Record<string, Path<FormValues>> = {
  vehiculoId: 'vehiculoId',
  clienteId: 'clienteId',
  tipoServicio: 'tipoServicio',
  fechaHora: 'fechaHora',
  duracionMinutos: 'duracionMinutos',
  observaciones: 'observaciones',
};

interface CitaTallerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculos: Vehiculo[];
  clientes: ClienteComercial[];
  onSubmit: (input: CreateCitaTallerInput) => Promise<void>;
  loading?: boolean;
}

function getDefaults(): FormValues {
  return {
    vehiculoId: '',
    clienteId: '',
    tipoServicio: 'mantenimiento',
    fechaHora: fechaHoraPorDefecto(),
    duracionMinutos: DURACION_DEFECTO,
    observaciones: '',
  };
}

/** Formulario de alta de cita del taller (HU13). */
export function CitaTallerFormDialog({
  open,
  onOpenChange,
  vehiculos,
  clientes,
  onSubmit,
  loading,
}: CitaTallerFormDialogProps) {
  const resolver = useMemo(() => zodResolver(schema) as Resolver<FormValues>, []);
  const form = useForm<FormValues>({ resolver, defaultValues: getDefaults() });
  const { control, register, handleSubmit, reset, setError, watch, formState: { errors } } = form;

  useEffect(() => {
    if (open) reset(getDefaults());
  }, [open, reset]);

  const vehiculoId = watch('vehiculoId');
  const seleccionado = vehiculos.find((v) => v.vehiculoId === vehiculoId) ?? null;

  const submit = handleSubmit(async (values) => {
    const payload: CreateCitaTallerInput = {
      vehiculoId: values.vehiculoId,
      clienteId: values.clienteId,
      tipoServicio: values.tipoServicio,
      fechaHora: new Date(values.fechaHora).toISOString(),
      duracionMinutos: values.duracionMinutos,
      observaciones: values.observaciones?.trim() ? values.observaciones : undefined,
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      Object.entries(fieldErrors).forEach(([campo, mensaje]) => {
        const ruta = RUTAS_SERVIDOR[campo];
        if (ruta) setError(ruta, { type: 'server', message: mensaje });
      });
    }
  });

  const fieldError = (name: keyof FormValues) => errors[name]?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva cita del taller</DialogTitle>
          <DialogDescription>
            Registra la cita dentro del horario de atención (de {HORARIO_INICIO}:00 a {HORARIO_FIN}:00, cada{' '}
            {PASO_MINUTOS} minutos). El taller confirmará la disponibilidad.
          </DialogDescription>
        </DialogHeader>

        <form className="max-h-[70vh] space-y-5 overflow-y-auto pr-1" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="vehiculoId">Vehículo</Label>
            <Controller
              control={control}
              name="vehiculoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="vehiculoId">
                    <SelectValue placeholder="Selecciona un vehículo" />
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
              <p className="text-xs text-muted-foreground">No hay vehículos en el inventario.</p>
            )}
          </div>

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
            {clientes.length === 0 && (
              <p className="text-xs text-muted-foreground">Primero debes registrar un cliente comercial.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoServicio">Tipo de servicio</Label>
            <Controller
              control={control}
              name="tipoServicio"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="tipoServicio">
                    <SelectValue placeholder="Selecciona el servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_SERVICIO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {TIPO_SERVICIO_LABELS[tipo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {fieldError('tipoServicio') && <p className="text-xs text-destructive">{fieldError('tipoServicio')}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fechaHora">Fecha y hora</Label>
              <Input id="fechaHora" type="datetime-local" step={PASO_MINUTOS * 60} {...register('fechaHora')} />
              {fieldError('fechaHora') && <p className="text-xs text-destructive">{fieldError('fechaHora')}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duracionMinutos">Duración (minutos)</Label>
              <Input
                id="duracionMinutos"
                type="number"
                min={DURACION_MIN}
                max={DURACION_MAX}
                step={15}
                {...register('duracionMinutos', { valueAsNumber: true })}
              />
              {fieldError('duracionMinutos') && (
                <p className="text-xs text-destructive">{fieldError('duracionMinutos')}</p>
              )}
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
                  {seleccionado.anio} · {formatPrecio(seleccionado.precio)}
                </span>
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              rows={3}
              placeholder="Problema reportado o indicaciones del vehículo (opcional)."
              {...register('observaciones')}
            />
            {fieldError('observaciones') && <p className="text-xs text-destructive">{fieldError('observaciones')}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || vehiculos.length === 0 || clientes.length === 0}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Registrar cita
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
