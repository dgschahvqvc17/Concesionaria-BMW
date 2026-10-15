import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { BmwRoundel } from '@/components/brand/BmwRoundel';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/lib/roles';

interface ProtectedRouteProps {
  /** Si se indica, el usuario debe tener al menos uno de estos roles. */
  roles?: UserRole[];
}

/** Protege rutas que requieren autenticación (y opcionalmente un rol). */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="pointer-events-none fixed inset-0 bg-bmw-mesh" aria-hidden="true" />
        <BmwRoundel className="relative h-12 w-12 animate-float" />
        <p className="relative text-sm text-muted-foreground">Verificando sesión…</p>
      </div>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.some((role) => user.roles.includes(role))) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return <Outlet />;
}
