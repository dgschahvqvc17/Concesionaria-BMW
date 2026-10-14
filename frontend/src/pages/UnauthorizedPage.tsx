import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';

import { MStripe } from '@/components/brand/MStripe';
import { Button } from '@/components/ui/button';

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-slide-up rounded-2xl border border-border/70 bg-card p-8 text-center shadow-panel">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <ShieldOff className="h-7 w-7 text-destructive" aria-hidden="true" />
        </div>

        <MStripe className="mx-auto mb-5 h-1.5 w-12" />

        <h1 className="text-xl font-semibold tracking-tight">Acceso restringido</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu rol no tiene permisos para acceder a esta sección del sistema.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Si crees que es un error, contacta al administrador.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            Volver
          </Button>
          <Button asChild>
            <Link to="/dashboard">Ir al panel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
