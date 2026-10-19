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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  nombres: z.string().trim().min(2).max(60),
  apellidos: z.string().trim().min(2).max(60),
  documento: z.string().trim().min(5).max(20).regex(/^[A-Za-z0-9-]+$/),
  telefono: z.string().trim().regex(/^[0-9+\s()-]{7,15}$/),
  email: z.string().trim().email().max(120),
  notas: z.string().trim().max(1000).optional(),
});

export type ClienteComercialFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ClienteComercialFormValues) => Promise<void>;
  initialValues?: Partial<ClienteComercialFormValues>;
  loading?: boolean;
  title?: string;
}

export function ClienteComercialFormDialog({ open, onOpenChange, onSubmit, initialValues, loading, title }: Props) {
  const form = useForm<ClienteComercialFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      documento: '',
      telefono: '',
      email: '',
      notas: '',
      ...initialValues,
    },
    values: initialValues as any,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title || 'Cliente comercial'}</DialogTitle>
          <DialogDescription>Completa los datos del cliente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nombres</Label>
              <Input {...form.register('nombres')} />
            </div>
            <div>
              <Label>Apellidos</Label>
              <Input {...form.register('apellidos')} />
            </div>
            <div>
              <Label>Documento</Label>
              <Input {...form.register('documento')} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input {...form.register('telefono')} />
            </div>
            <div className="sm:col-span-2">
              <Label>Email</Label>
              <Input {...form.register('email')} />
            </div>
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea {...form.register('notas')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
