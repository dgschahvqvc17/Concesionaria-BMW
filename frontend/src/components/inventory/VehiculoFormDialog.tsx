import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { DocumentosUploader } from '@/components/inventory/DocumentosUploader';
import { PhotoUploader } from '@/components/inventory/PhotoUploader';
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
  CONDICIONES,
  CONDICION_LABELS,
  ESTADOS,
  ESTADO_LABELS,
  TIPOS,
  TIPO_LABELS,
} from '@/lib/vehiculos';
import type {
  CondicionVehiculo,
  CreateVehiculoInput,
  EstadoVehiculo,
  TipoVehiculo,
  UpdateVehiculoInput,
  Vehiculo,
  VehiculoDocumento,
  VehiculoFoto,
} from '@/types/vehiculo';

const anioActual = new Date().getFullYear();

const schema = z.object({
  marca: z.string().trim().min(2, 'La marca es obligatoria.').max(50),
  modelo: z.string().trim().min(1, 'El modelo es obligatorio.').max(60),
  anio: z.coerce
    .number({ invalid_type_error: 'El año es obligatorio.' })
    .int('El año debe ser un número entero.')
    .min(1950, 'El año no puede ser anterior a 1950.')
    .max(anioActual + 1, `El año no puede ser mayor a ${anioActual + 1}.`),
  version: z.string().trim().min(1, 'La versión es obligatoria.').max(80),
  kilometraje: z.coerce
    .number({ invalid_type_error: 'El kilometraje es obligatorio.' })
    .int('El kilometraje debe ser un número entero.')
    .min(0, 'El kilometraje no puede ser negativo.'),
  precio: z.coerce
    .number({ invalid_type_error: 'El precio es obligatorio.' })
    .positive('El precio debe ser mayor a 0.'),
  color: z.string().trim().min(1, 'El color es obligatorio.').max(40),
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'El VIN debe tener 17 caracteres válidos (sin I, O ni Q).'),
  condicion: z.enum([...CONDICIONES] as [CondicionVehiculo, ...CondicionVehiculo[]]),
  tipo: z.enum([...TIPOS] as [TipoVehiculo, ...TipoVehiculo[]]),
  estado: z.enum([...ESTADOS] as [EstadoVehiculo, ...EstadoVehiculo[]]),
  descripcion: z.string().trim().max(1000, 'La descripción no puede superar los 1000 caracteres.').optional(),
  caracteristicas: z.string().optional(),
  publicado: z.enum(['si', 'no']),
});

type FormValues = z.infer<typeof schema>;

interface VehiculoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Vehículo a editar; `null` para registrar uno nuevo. */
  vehiculo: Vehiculo | null;
  submitting: boolean;
  onSubmit: (input: CreateVehiculoInput | UpdateVehiculoInput) => Promise<void>;
}

function getDefaults(vehiculo: Vehiculo | null): FormValues {
  return {
    marca: vehiculo?.marca ?? '',
    modelo: vehiculo?.modelo ?? '',
    anio: vehiculo?.anio ?? anioActual,
    version: vehiculo?.version ?? '',
    kilometraje: vehiculo?.kilometraje ?? 0,
    precio: vehiculo?.precio ?? 0,
    color: vehiculo?.color ?? '',
    vin: vehiculo?.vin ?? '',
    condicion: vehiculo?.condicion ?? 'nuevo',
    tipo: vehiculo?.tipo ?? 'sedan',
    estado: vehiculo?.estado ?? 'disponible',
    descripcion: vehiculo?.descripcion ?? '',
    caracteristicas: (vehiculo?.caracteristicas ?? []).join('\n'),
    publicado: vehiculo?.publicado === false ? 'no' : 'si',
  };
}

/** Formulario de registro y edición de vehículos (HU03). */
export function VehiculoFormDialog({
  open,
  onOpenChange,
  vehiculo,
  submitting,
  onSubmit,
}: VehiculoFormDialogProps) {
  const isEdit = Boolean(vehiculo);
  const [fotos, setFotos] = useState<VehiculoFoto[]>([]);
  const [documentos, setDocumentos] = useState<VehiculoDocumento[]>([]);

  const resolver = useMemo(() => zodResolver(schema) as Resolver<FormValues>, []);

  const form = useForm<FormValues>({ resolver, defaultValues: getDefaults(vehiculo) });
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      reset(getDefaults(vehiculo));
      setFotos(vehiculo?.fotos ?? []);
      setDocumentos(vehiculo?.documentos ?? []);
    }
  }, [open, vehiculo, reset]);

  const submit = handleSubmit(async (values) => {
    const payload: CreateVehiculoInput = {
      marca: values.marca,
      modelo: values.modelo,
      anio: values.anio,
      version: values.version,
      kilometraje: values.kilometraje,
      precio: values.precio,
      color: values.color,
      vin: values.vin.toUpperCase(),
      condicion: values.condicion,
      tipo: values.tipo,
      estado: values.estado,
      descripcion: values.descripcion?.trim() ?? '',
      caracteristicas: (values.caracteristicas ?? '')
        .split('\n')
        .map((linea) => linea.trim())
        .filter(Boolean),
      publicado: values.publicado === 'si',
      fotos: fotos.map((foto) => foto.key),
      documentos: documentos.map((documento) => ({ key: documento.key, nombre: documento.nombre })),
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
          <DialogTitle>{isEdit ? 'Editar vehículo' : 'Registrar vehículo'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza la información del vehículo en el inventario.'
              : 'Completa los datos del vehículo nuevo o seminuevo.'}
          </DialogDescription>
        </DialogHeader>

        <form className="max-h-[65vh] space-y-4 overflow-y-auto pr-1" onSubmit={submit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" placeholder="BMW" {...register('marca')} />
              {fieldError('marca') && <p className="text-xs text-destructive">{fieldError('marca')}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" placeholder="Serie 3" {...register('modelo')} />
              {fieldError('modelo') && <p className="text-xs text-destructive">{fieldError('modelo')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="anio">Año</Label>
              <Input id="anio" type="number" {...register('anio', { valueAsNumber: true })} />
              {fieldError('anio') && <p className="text-xs text-destructive">{fieldError('anio')}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Versión</Label>
              <Input id="version" placeholder="330i M Sport" {...register('version')} />
              {fieldError('version') && <p className="text-xs text-destructive">{fieldError('version')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kilometraje">Kilometraje (km)</Label>
              <Input id="kilometraje" type="number" {...register('kilometraje', { valueAsNumber: true })} />
              {fieldError('kilometraje') && (
                <p className="text-xs text-destructive">{fieldError('kilometraje')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio</Label>
              <Input id="precio" type="number" step="0.01" {...register('precio', { valueAsNumber: true })} />
              {fieldError('precio') && <p className="text-xs text-destructive">{fieldError('precio')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" placeholder="Negro Zafiro" {...register('color')} />
              {fieldError('color') && <p className="text-xs text-destructive">{fieldError('color')}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="condicion">Condición</Label>
              <Controller
                control={control}
                name="condicion"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="condicion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDICIONES.map((condicion) => (
                        <SelectItem key={condicion} value={condicion}>
                          {CONDICION_LABELS[condicion]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {fieldError('condicion') && (
                <p className="text-xs text-destructive">{fieldError('condicion')}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="vin">VIN (número de identificación vehicular)</Label>
              <Input id="vin" placeholder="17 caracteres" className="uppercase" {...register('vin')} />
              {fieldError('vin') && <p className="text-xs text-destructive">{fieldError('vin')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {TIPO_LABELS[tipo]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {fieldError('tipo') && <p className="text-xs text-destructive">{fieldError('tipo')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Controller
                control={control}
                name="estado"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="estado">
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
                )}
              />
              {fieldError('estado') && <p className="text-xs text-destructive">{fieldError('estado')}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Descripción general del vehículo para el catálogo web."
                {...register('descripcion')}
              />
              {fieldError('descripcion') && (
                <p className="text-xs text-destructive">{fieldError('descripcion')}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="caracteristicas">Características principales</Label>
              <Textarea
                id="caracteristicas"
                placeholder={'Una por línea, por ejemplo:\nTecho panorámico\nAsientos de cuero\nCámara 360°'}
                {...register('caracteristicas')}
              />
              {fieldError('caracteristicas') && (
                <p className="text-xs text-destructive">{fieldError('caracteristicas')}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="publicado">Catálogo web</Label>
              <Controller
                control={control}
                name="publicado"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="publicado">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Publicar en el catálogo</SelectItem>
                      <SelectItem value="no">No publicar (oculto)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Los vehículos no publicados no se muestran en el catálogo web.
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Fotografías</Label>
              <PhotoUploader fotos={fotos} onChange={setFotos} disabled={submitting} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Documentos autorizados</Label>
              <DocumentosUploader
                documentos={documentos}
                onChange={setDocumentos}
                disabled={submitting}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isEdit ? 'Guardar cambios' : 'Registrar vehículo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
