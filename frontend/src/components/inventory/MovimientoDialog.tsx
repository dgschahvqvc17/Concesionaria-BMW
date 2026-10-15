import { useEffect, useMemo } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIPOS_MOVIMIENTO, TIPO_MOVIMIENTO_LABELS } from '@/lib/repuestos';
import type { CreateMovimientoInput, Repuesto, TipoMovimiento } from '@/types/repuesto';

const schema = z.object({
  tipo: z.enum(['entrada', 'salida']),
  cantidad: z.coerce
    .number({ invalid_type_error: 'La cantidad es obligatoria.' })
    .int('La cantidad debe ser un número entero.')
    .positive('La cantidad debe ser mayor a 0.'),
  motivo: z.string().trim().max(120, 'Máximo 120 caracteres.').optional(),
});

type FormValues = z.infer<typeof schema>;

interface MovimientoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Repuesto sobre el que se registra el movimiento; `null` cierra el diálogo. */
  repuesto: Repuesto | null;
  tipoInicial: TipoMovimiento;
  submitting: boolean;
  onSubmit: (input: CreateMovimientoInput) => Promise<void>;
}

/** Diálogo para registrar una entrada o salida de existencias (HU04). */
export function MovimientoDialog({
  open,
  onOpenChange,
  repuesto,
  tipoInicial,
  submitting,
  onSubmit,
}: MovimientoDialogProps) {
  const resolver = useMemo(() => zodResolver(schema) as Resolver<FormValues>, []);

  const form = useForm<FormValues>({
    resolver,
    defaultValues: { tipo: tipoInicial, cantidad: 1, motivo: '' },
  });
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
    if (open) reset({ tipo: tipoInicial, cantidad: 1, motivo: '' });
  }, [open, tipoInicial, reset]);

  const tipo = watch('tipo');
  const cantidad = Number(watch('cantidad')) || 0;
  const stock = repuesto?.cantidad ?? 0;

  const submit = handleSubmit(async (values) => {
    if (!repuesto) return;

    if (values.tipo === 'salida' && values.cantidad > stock) {
      setError('cantidad', {
        type: 'server',
        message: `Solo hay ${stock} unidades disponibles.`,
      });
      return;
    }

    try {
      await onSubmit({
        repuestoId: repuesto.repuestoId,
        tipo: values.tipo,
        cantidad: values.cantidad,
        motivo: values.motivo ?? '',
      });
    } catch (error) {
      const message = (error as { message?: string })?.message ?? 'No se pudo registrar el movimiento.';
      setError('cantidad', { type: 'server', message });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
          <DialogDescription>
            {repuesto ? `${repuesto.codigo} · ${repuesto.nombre}` : ''}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de movimiento</Label>
            <Controller
              control={control}
              name="tipo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_MOVIMIENTO.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TIPO_MOVIMIENTO_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input id="cantidad" type="number" min={1} {...register('cantidad', { valueAsNumber: true })} />
            {errors.cantidad && <p className="text-xs text-destructive">{errors.cantidad.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Input id="motivo" placeholder="Orden de trabajo, compra, ajuste…" {...register('motivo')} />
            {errors.motivo && <p className="text-xs text-destructive">{errors.motivo.message}</p>}
          </div>

          {repuesto && (
            <div className="rounded-xl bg-muted/50 p-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Existencias actuales</span>
                <span className="font-medium text-foreground">{repuesto.cantidad}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-muted-foreground">
                <span>Existencias resultantes</span>
                <span
                  className={
                    tipo === 'salida' && cantidad > stock
                      ? 'font-semibold text-destructive'
                      : 'font-medium text-foreground'
                  }
                >
                  {tipo === 'salida' ? stock - cantidad : stock + cantidad}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Registrar {TIPO_MOVIMIENTO_LABELS[tipo].toLowerCase()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
