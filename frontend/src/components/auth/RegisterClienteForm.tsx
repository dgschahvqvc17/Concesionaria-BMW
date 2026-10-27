import { useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clientesService } from '@/services/clientes';
import { getErrorMessage, getFieldErrors } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const schema = z.object({
  nombre: z.string().trim().min(3, 'El nombre completo debe tener al menos 3 caracteres.').max(80),
  email: z.string().trim().email('Ingresa un correo electrónico válido.').max(120),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres.')
    .regex(/[a-z]/, 'Debe incluir una minúscula.')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula.')
    .regex(/[0-9]/, 'Debe incluir un número.'),
  fechaNacimiento: z
    .string()
    .min(1, 'La fecha de nacimiento es obligatoria.')
    .refine((value) => new Date(value).getTime() <= Date.now(), 'La fecha no puede ser futura.')
    .refine((value) => esMayorDeEdad(value), 'Debes ser mayor de edad para registrarte.'),
  carnetIdentidad: z
    .string()
    .trim()
    .min(5, 'El carnet debe tener al menos 5 caracteres.')
    .max(20, 'El carnet no debe superar 20 caracteres.')
    .regex(/^[A-Za-z0-9-]+$/, 'Solo letras, números y guiones.'),
  celular: z.string().trim().regex(/^[0-9+\s-]{7,15}$/, 'Ingresa un celular válido (entre 7 y 15 dígitos).'),
});

type FormValues = z.infer<typeof schema>;

interface RegisterClienteFormProps {
  onBack: () => void;
  onRegistered: (email: string) => void;
}

const hoy = new Date().toISOString().slice(0, 10);

function esMayorDeEdad(fechaNacimiento: string): boolean {
  const nacimiento = new Date(fechaNacimiento);
  const hoyFecha = new Date();
  let edad = hoyFecha.getFullYear() - nacimiento.getFullYear();
  const mes = hoyFecha.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoyFecha.getDate() < nacimiento.getDate())) {
    edad -= 1;
  }
  return edad >= 18;
}

/** Autorregistro de clientes desde la pantalla de login. */
export function RegisterClienteForm({ onBack, onRegistered }: RegisterClienteFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      fechaNacimiento: '',
      carnetIdentidad: '',
      celular: '',
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await clientesService.registrar(values);
      try {
        await login(values.email.trim(), values.password);
        navigate('/catalogo', { replace: true });
        return;
      } catch {
        // Si por alguna razón no se logra loguear automáticamente, volvemos al login
        onRegistered(values.email.trim());
        return;
      }
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      const fields = Object.keys(fieldErrors) as Array<keyof FormValues>;
      if (fields.length > 0) {
        fields.forEach((field) => setError(field, { type: 'server', message: fieldErrors[field] }));
      } else {
        setFormError(getErrorMessage(error));
      }
    }
  });

  return (
    <div className="relative w-full max-w-md animate-slide-up overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 shadow-panel backdrop-blur-lg">
      <span className="absolute inset-x-0 top-0 h-1 bg-m-gradient" aria-hidden="true" />

      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Volver al inicio de sesión
      </button>

      <div className="mb-6 space-y-2">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
          Cuenta de cliente
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Crear cuenta nueva</h2>
        <p className="text-sm text-muted-foreground">
          Registro exclusivo para clientes. Completa tus datos para continuar.
        </p>
      </div>

      <form onSubmit={submit} noValidate className="space-y-5">
        {formError && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>No se pudo crear la cuenta</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre completo</Label>
          <Input
            id="nombre"
            autoComplete="name"
            placeholder="María Fernanda López"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.nombre)}
            className="h-11"
            {...register('nombre')}
          />
          {errors.nombre && <p className="text-xs font-medium text-destructive">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="cliente@correo.com"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.email)}
            className="h-11"
            {...register('email')}
          />
          {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.password)}
              className="h-11 pr-11"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
            <Controller
              control={control}
              name="fechaNacimiento"
              render={({ field }) => (
                <Input
                  id="fechaNacimiento"
                  type="date"
                  max={hoy}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.fechaNacimiento)}
                  className="h-11"
                  {...field}
                />
              )}
            />
            {errors.fechaNacimiento && (
              <p className="text-xs font-medium text-destructive">{errors.fechaNacimiento.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="carnetIdentidad">Carnet de identidad</Label>
            <Input
              id="carnetIdentidad"
              placeholder="12345678"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.carnetIdentidad)}
              className="h-11"
              {...register('carnetIdentidad')}
            />
            {errors.carnetIdentidad && (
              <p className="text-xs font-medium text-destructive">{errors.carnetIdentidad.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="celular">Número de celular</Label>
          <Input
            id="celular"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+591 700 00000"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.celular)}
            className="h-11"
            {...register('celular')}
          />
          {errors.celular && <p className="text-xs font-medium text-destructive">{errors.celular.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creando cuenta…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Crear cuenta
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
