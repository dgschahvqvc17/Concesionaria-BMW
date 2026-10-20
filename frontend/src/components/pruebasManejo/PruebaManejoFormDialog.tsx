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
  esVehiculoParaPrueba,
  fechaHoraPorDefecto,
  validarFechaPrueba,
} from '@/lib/pruebasManejo';
import { formatPrecio } from '@/lib/repuestos';
import type { ClienteComercial } from '@/types/clienteComercial';
import type { CreatePruebaManejoInput } from '@/types/pruebaManejo';
import type { Vehiculo } from '@/types/vehiculo';

const schema = z.object({
  vehiculoId: z.string().min(1, 'Selecciona un vehículo.'),
  clienteId: z.string().optional(),
  contacto: z.object({
    nombre: z.string().trim().min(2, 'Indica el nombre del solicitante.').max(120, 'Máximo 120 caracteres.'),
    telefono: z.string().trim().min(6, 'Indica un teléfono válido.').max(30, 'Máximo 30 caracteres.'),
    email: z.union([z.string().email('Correo electrónico no válido.'), z.literal('')]).optional(),
  }),
  fechaHora: z.string().min(1, 'Elige la fecha y hora de la prueba.').superRefine((valor, contexto) => {
    const error = validarFechaPrueba(valor);
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
  fechaHora: 'fechaHora',
  duracionMinutos: 'duracionMinutos',
  observaciones: 'observaciones',
  contacto: 'contacto.nombre',
  'contacto.nombre': 'contacto.nombre',
  'contacto.telefono': 'contacto.telefono',
  'contacto.email': 'contacto.email',
};

/** Vehículo fijo (desde el catálogo público) o del inventario. */
interface VehiculoPrueba {
  vehiculoId: string;
  marca: string;
  modelo: string;
  version: string;
  anio: number;
  precio: number;
  estado: string;
  publicado?: boolean;
}

interface PruebaManejoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculos: Vehiculo[];
  vehiculoFijo?: VehiculoPrueba;
  clientes?: ClienteComercial[];
  clienteFijo?: ClienteComercial | null;
  onSubmit: (input: CreatePruebaManejoInput) => Promise<void>;
  loading?: boolean;
}

function getDefaults(vehiculoFijo?: VehiculoPrueba, clienteFijo?: ClienteComercial | null): FormValues {
  return {
    vehiculoId: vehiculoFijo?.vehiculoId ?? '',
    clienteId: clienteFijo?.clienteId ?? '',
    contacto: {
      nombre: clienteFijo ? `${clienteFijo.nombres} ${clienteFijo.apellidos}`.trim() : '',
      telefono: clienteFijo?.telefono ?? '',
      email: clienteFijo?.email ?? '',
    },
    fechaHora: fechaHoraPorDefecto(),
    duracionMinutos: DURACION_DEFECTO,
    observaciones: '',
  };
}

/** Formulario de solicitud de prueba de manejo (HU11): público desde catálogo o interno. */
export function PruebaManejoFormDialog({
  open,
  onOpenChange,
  vehiculos,
  vehiculoFijo,
  clientes,
  clienteFijo,
  onSubmit,
  loading,
}: PruebaManejoFormDialogProps) {
  const resolver = useMemo(() => zodResolver(schema) as Resolver<FormValues>, []);
  const form = useForm<FormValues>({
    resolver,
    defaultValues: getDefaults(vehiculoFijo, clienteFijo),
  });
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) reset(getDefaults(vehiculoFijo, clienteFijo));
  }, [open, reset, vehiculoFijo, clienteFijo]);

  const vehiculosPrueba = useMemo(() => vehiculos.filter(esVehiculoParaPrueba), [vehiculos]);
  const vehiculoId = watch('vehiculoId');
  const clienteId = watch('clienteId');
  const seleccionado = vehiculoFijo ?? vehiculosPrueba.find((v) => v.vehiculoId === vehiculoId) ?? null;
  const clienteSeleccionado = clienteFijo ?? clientes?.find((c) => c.clienteId === clienteId) ?? null;

  useEffect(() => {
    if (!open || !clienteSeleccionado) return;
    if (!watch('contacto.nombre')) {
      setValue('contacto.nombre', `${clienteSeleccionado.nombres} ${clienteSeleccionado.apellidos}`.trim());
    }
    if (!watch('contacto.telefono')) setValue('contacto.telefono', clienteSeleccionado.telefono);
    if (!watch('contacto.email')) setValue('contacto.email', clienteSeleccionado.email);
  }, [open, clienteSeleccionado, setValue, watch]);

  const submit = handleSubmit(async (values) => {
    const payload: CreatePruebaManejoInput = {
      vehiculoId: vehiculoFijo ? vehiculoFijo.vehiculoId : values.vehiculoId,
      contacto: {
        nombre: values.contacto.nombre,
        telefono: values.contacto.telefono,
        email: values.contacto.email?.trim() ? values.contacto.email.trim() : undefined,
      },
      fechaHora: new Date(values.fechaHora).toISOString(),
      duracionMinutos: values.duracionMinutos,
      observaciones: values.observaciones?.trim() ? values.observaciones : undefined,
    };
    if (values.clienteId) payload.clienteId = values.clienteId;

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
  const contactoError = (campo: 'nombre' | 'telefono' | 'email') => errors.contacto?.[campo]?.message;
  const mostrarSelectorVehiculo = !vehiculoFijo;
  const mostrarSelectorCliente = clientes !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Solicitar prueba de manejo</DialogTitle>
          <DialogDescription>
            Agenda una prueba en el horario de atención (de {HORARIO_INICIO}:00 a {HORARIO_FIN}:00, cada{' '}
            {PASO_MINUTOS} minutos). El equipo comercial confirmará la solicitud.
          </DialogDescription>
        </DialogHeader>

        <form className="max-h-[70vh] space-y-5 overflow-y-auto pr-1" onSubmit={submit} noValidate>
          {mostrarSelectorVehiculo && (
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
                      {vehiculosPrueba.map((vehiculo) => (
                        <SelectItem key={vehiculo.vehiculoId} value={vehiculo.vehiculoId}>
                          {vehiculo.marca} {vehiculo.modelo} {vehiculo.version} — {formatPrecio(vehiculo.precio)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {fieldError('vehiculoId') && <p className="text-xs text-destructive">{fieldError('vehiculoId')}</p>}
              {vehiculosPrueba.length === 0 && (
                <p className="text-xs text-muted-foreground">No hay vehículos elegibles para pruebas.</p>
              )}
            </div>
          )}

          {mostrarSelectorCliente && (
            <div className="space-y-2">
              <Label htmlFor="clienteId">Cliente (opcional)</Label>
              <Controller
                control={control}
                name="clienteId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="clienteId">
                      <SelectValue placeholder="Sin vincular a un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin vincular a un cliente</SelectItem>
                      {(clientes ?? []).map((cliente) => (
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
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contacto-nombre">Nombre del solicitante</Label>
              <Input id="contacto-nombre" placeholder="Nombre y apellido" {...register('contacto.nombre')} />
              {contactoError('nombre') && <p className="text-xs text-destructive">{contactoError('nombre')}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contacto-telefono">Teléfono</Label>
              <Input id="contacto-telefono" placeholder="70000000" {...register('contacto.telefono')} />
              {contactoError('telefono') && <p className="text-xs text-destructive">{contactoError('telefono')}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contacto-email">Correo electrónico (opcional)</Label>
            <Input id="contacto-email" type="email" placeholder="correo@ejemplo.com" {...register('contacto.email')} />
            {contactoError('email') && <p className="text-xs text-destructive">{contactoError('email')}</p>}
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
              placeholder="Indicaciones del solicitante (opcional)."
              {...register('observaciones')}
            />
            {fieldError('observaciones') && <p className="text-xs text-destructive">{fieldError('observaciones')}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || (!vehiculoFijo && vehiculosPrueba.length === 0)}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Solicitar prueba
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
