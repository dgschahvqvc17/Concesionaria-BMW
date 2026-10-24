import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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
import { getFieldErrors } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/brand';
import { STAFF_ROLES, isStaffRole, type StaffRole } from '@/lib/roles';
import type { CreateUsuarioInput, EstadoUsuario, UpdateUsuarioInput, Usuario } from '@/types/usuario';

const roleEnum = z.enum([...STAFF_ROLES] as [StaffRole, ...StaffRole[]]);

const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres.')
  .regex(/[a-z]/, 'Debe incluir una minúscula.')
  .regex(/[A-Z]/, 'Debe incluir una mayúscula.')
  .regex(/[0-9]/, 'Debe incluir un número.');

const createSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.').max(80),
  email: z.string().trim().email('Ingresa un correo electrónico válido.'),
  rol: roleEnum,
  password: passwordSchema,
});

const editSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.').max(80),
  rol: roleEnum,
  estado: z.enum(['activo', 'inactivo']),
});

interface FormValues {
  nombre: string;
  email: string;
  rol: StaffRole;
  password: string;
  estado: EstadoUsuario;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Usuario a editar; `null` para el modo de registro. */
  usuario: Usuario | null;
  submitting: boolean;
  onSubmit: (input: CreateUsuarioInput | UpdateUsuarioInput) => Promise<void>;
}

function getDefaults(usuario: Usuario | null): FormValues {
  return {
    nombre: usuario?.nombre ?? '',
    email: usuario?.email ?? '',
    rol: usuario && isStaffRole(usuario.rol) ? usuario.rol : 'mecanico',
    password: '',
    estado: usuario?.estado ?? 'activo',
  };
}

/** Formulario de registro y edición de usuarios (HU02). */
export function UserFormDialog({ open, onOpenChange, usuario, submitting, onSubmit }: UserFormDialogProps) {
  const isEdit = Boolean(usuario);
  const esCliente = usuario?.rol === 'cliente';
  const [showPassword, setShowPassword] = useState(false);

  const resolver = useMemo(
    () => zodResolver(isEdit ? editSchema : createSchema) as Resolver<FormValues>,
    [isEdit]
  );

  const form = useForm<FormValues>({ resolver, defaultValues: getDefaults(usuario) });
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
      reset(getDefaults(usuario));
      setShowPassword(false);
    }
  }, [open, usuario, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      if (isEdit && usuario) {
        if (usuario.rol === 'cliente') {
          await onSubmit({ nombre: values.nombre, estado: values.estado });
        } else {
          await onSubmit({ nombre: values.nombre, rol: values.rol, estado: values.estado });
        }
      } else {
        await onSubmit({
          nombre: values.nombre,
          email: values.email,
          rol: values.rol,
          password: values.password,
        });
      }
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      (Object.keys(fieldErrors) as Array<keyof FormValues>).forEach((field) => {
        setError(field, { type: 'server', message: fieldErrors[field] });
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar usuario' : 'Registrar nuevo usuario'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza los datos, el rol o el estado del usuario.'
              : 'Completa los datos para dar de alta a un nuevo integrante del concesionario.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input id="nombre" placeholder="Ej. Juan Pérez" autoComplete="off" {...register('nombre')} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@bmw.com"
              autoComplete="off"
              disabled={isEdit}
              {...register('email')}
            />
            {isEdit && <p className="text-xs text-muted-foreground">El correo no se puede modificar.</p>}
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            {esCliente ? (
              <>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm">
                  {ROLE_LABELS.cliente}
                </div>
                <p className="text-xs text-muted-foreground">
                  Los clientes se autorregistran desde el login; su rol no puede modificarse.
                </p>
              </>
            ) : (
              <>
                <Controller
                  control={control}
                  name="rol"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="rol">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAFF_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  El personal se gestiona aquí; los clientes se crean desde el registro público.
                </p>
                {errors.rol && <p className="text-xs text-destructive">{errors.rol.message}</p>}
              </>
            )}
          </div>

          {isEdit ? (
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
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.estado && <p className="text-xs text-destructive">{errors.estado.message}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña temporal</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Debe incluir mayúscula, minúscula y número. El usuario la usará para iniciar sesión.
              </p>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isEdit ? 'Guardar cambios' : 'Registrar usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
