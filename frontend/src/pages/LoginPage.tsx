import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CarFront } from 'lucide-react';
import { toast } from 'sonner';

import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterClienteForm } from '@/components/auth/RegisterClienteForm';
import { BmwRoundel } from '@/components/brand/BmwRoundel';
import { MStripe } from '@/components/brand/MStripe';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'registro'>('login');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleRegistered = (email: string) => {
    setRegisteredEmail(email);
    setMode('login');
    toast.success('Cuenta creada correctamente. Ya puedes iniciar sesión.');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AuthBrandPanel />

      <main className="relative flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-bmw-mesh" aria-hidden="true" />

        <div className="relative flex w-full max-w-md flex-col items-center">
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <BmwRoundel className="h-12 w-12" />
            <div className="space-y-1">
              <p className="flex items-center justify-center gap-2 text-lg font-semibold tracking-tight">
                <MStripe className="h-4 w-8" />
                {APP_NAME}
              </p>
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                {APP_TAGLINE}
              </p>
            </div>
          </div>

          {mode === 'login' ? (
            <LoginForm onCreateAccount={() => setMode('registro')} initialEmail={registeredEmail} />
          ) : (
            <RegisterClienteForm onBack={() => setMode('login')} onRegistered={handleRegistered} />
          )}

          <Link
            to="/catalogo"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <CarFront className="h-4 w-4" aria-hidden="true" />
            Explorar el catálogo sin iniciar sesión
          </Link>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
