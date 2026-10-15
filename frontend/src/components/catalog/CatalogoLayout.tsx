import { Link, Outlet } from 'react-router-dom';
import { LogIn } from 'lucide-react';

import { BmwRoundel } from '@/components/brand/BmwRoundel';
import { MStripe } from '@/components/brand/MStripe';
import { Button } from '@/components/ui/button';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';

/** Estructura pública del catálogo web, accesible sin iniciar sesión (HU05). */
export function CatalogoLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-bmw-mesh" aria-hidden="true" />

      <header className="glass sticky top-0 z-30 border-b border-border/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/catalogo" className="flex items-center gap-3">
            <BmwRoundel className="h-9 w-9" />
            <span className="flex flex-col leading-none">
              <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                <MStripe className="h-3 w-7" />
                {APP_NAME}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Catálogo de vehículos
              </span>
            </span>
          </Link>

          <Button asChild variant="outline" size="sm">
            <Link to="/login">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Iniciar sesión
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        {APP_NAME} · {APP_TAGLINE}
      </footer>
    </div>
  );
}

export default CatalogoLayout;
