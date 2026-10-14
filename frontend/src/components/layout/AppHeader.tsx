import { LogOut } from 'lucide-react';

import { BmwRoundel } from '@/components/brand/BmwRoundel';
import { MStripe } from '@/components/brand/MStripe';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { APP_NAME, APP_TAGLINE, ROLE_LABELS } from '@/lib/brand';

/** Cabecera de la aplicación para usuarios autenticados. */
export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <BmwRoundel className="h-9 w-9" />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">{APP_NAME}</p>
            <p className="hidden text-xs text-muted-foreground sm:block">{APP_TAGLINE}</p>
          </div>
          <MStripe className="ml-1 hidden h-5 w-9 sm:inline-flex" />
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium">{user.nombre}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.rol]}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
