import { useEffect, useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
import { getFieldErrors } from '@/lib/api';
import type { CreateRepuestoInput, Repuesto, UpdateRepuestoInput } from '@/types/repuesto';

const codigoSchema = z
  .string()
  .trim()
  .min(2, 'El código debe tener al menos 2 caracteres.')
  .max(30, 'El código no puede superar 30 caracteres.')
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Solo letras, números, punto, guion y guion bajo.');

const base = {
  codigo: codigoSchema,
  nombre: z.string().trim().min(2, 'El nombre es obligatorio.').max(80),
  descripcion: z.string().trim().max(200, 'Máximo 200 caracteres.').optional(),
  precio: z.coerce
    .number({ invalid_type_error: 'El precio es obligatorio.' })
    .positive('El precio debe ser mayor a 0.')
    .max(100000000, 'El precio supera el máximo permitido.'),
  cantidadMinima: z.coerce
    .number({ invalid_type_error: 'La cantidad mínima es obligatoria.' })
    .int('Debe ser un número entero.')
    .min(0, 'No puede ser negativa.'),
};

const createSchema = z.object({
  ...base,
  cantidad: z.coerce
    .number({ invalid_type_error: 'La cantidad es obligatoria.' })
    .int('La cantidad debe ser un número entero.')
    .min(0, 'La cantidad no puede ser negativa.'),
});

const editSchema = z.object(base);

type FormValues = z.infer<typeof createSchema>;

interface RepuestoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Repuesto a editar; `null` para registrar uno nuevo. */
  repuesto: Repuesto | null;
  submitting: boolean;
  onSubmit: (input: CreateRepuestoInput | UpdateRepuestoInput) => Promise<void>;
}

function getDefaults(repuesto: Repuesto | null): FormValues {
  return {
    codigo: repuesto?.codigo ?? '',
    nombre: repuesto?.nombre ?? '',
    descripcion: repuesto?.descripcion ?? '',
    precio: repuesto?.precio ?? 0,
    cantidad: repuesto?.cantidad ?? 0,
    cantidadMinima: repuesto?.cantidadMinima ?? 0,
  };
}

/** Formulario de registro y edición de repuestos (HU04). */
export function RepuestoFormDialog({
  open,
  onOpenChange,
  repuesto,
  submitting,
  onSubmit,
}: RepuestoFormDialogProps) {
  const isEdit = Boolean(repuesto);

  const resolver = useMemo(
    () => zodResolver(isEdit ? editSchema : createSchema) as Resolver<FormValues>,
    [isEdit]
  );

  const form = useForm<FormValues>({ resolver, defaultValues: getDefaults(repuesto) });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) reset(getDefaults(repuesto));
  }, [open, repuesto, reset]);

  const submit = handleSubmit(async (values) => {
    const payload: CreateRepuestoInput | UpdateRepuestoInput = {
      codigo: values.codigo.toUpperCase(),
      nombre: values.nombre,
      descripcion: values.descripcion ?? '',
      precio: values.precio,
      cantidadMinima: values.cantidadMinima,
      ...(isEdit ? {} : { cantidad: values.cantidad }),
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar repuesto' : 'Registrar repuesto'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza los datos del repuesto. Las existencias se ajustan registrando entradas o salidas.'
              : 'Completa los datos del repuesto y su cantidad inicial en el inventario.'}
          </DialogDescription>
        </DialogHeader>

        <form className="max-h-[65vh] space-y-4 overflow-y-auto pr-1" onSubmit={submit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" placeholder="REP-0001" className="uppercase" {...register('codigo')} />
              {fieldError('codigo') && <p className="text-xs text-destructive">{fieldError('codigo')}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" placeholder="Filtro de aceite" {...register('nombre')} />
              {fieldError('nombre') && <p className="text-xs text-destructive">{fieldError('nombre')}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input id="descripcion" placeholder="Detalle o compatibilidad" {...register('descripcion')} />
              {fieldError('descripcion') && (
                <p className="text-xs text-destructive">{fieldError('descripcion')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio">Precio unitario</Label>
              <Input id="precio" type="number" step="0.01" {...register('precio', { valueAsNumber: true })} />
              {fieldError('precio') && <p className="text-xs text-destructive">{fieldError('precio')}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cantidadMinima">Cantidad mínima</Label>
              <Input id="cantidadMinima" type="number" {...register('cantidadMinima', { valueAsNumber: true })} />
              {fieldError('cantidadMinima') && (
                <p className="text-xs text-destructive">{fieldError('cantidadMinima')}</p>
              )}
            </div>

            {isEdit ? (
              <div className="space-y-1 sm:col-span-2">
                <Label>Existencias actuales</Label>
                <p className="text-sm font-medium">
                  {repuesto?.cantidad ?? 0}{' '}
                  <span className="font-normal text-muted-foreground">
                    (se modifican con entradas y salidas)
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad disponible</Label>
                <Input id="cantidad" type="number" {...register('cantidad', { valueAsNumber: true })} />
                {fieldError('cantidad') && (
                  <p className="text-xs text-destructive">{fieldError('cantidad')}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isEdit ? 'Guardar cambios' : 'Registrar repuesto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
