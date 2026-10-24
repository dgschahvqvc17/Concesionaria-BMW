import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchAuthSession, getCurrentUser, signIn as amplifySignIn, signOut as amplifySignOut } from 'aws-amplify/auth';

import { getSessionProfile } from '@/lib/api';
import { AuthUiError, toAuthErrorMessage } from '@/lib/cognito-errors';
import { normalizeRoles, primaryRole, type UserRole } from '@/lib/roles';

export interface AuthUser {
  sub: string;
  email: string;
  nombre: string;
  /** Roles asignados en Cognito (groups). */
  roles: UserRole[];
  /** Rol principal, usado para mostrar en la UI y para rutas protegidas. */
  rol: UserRole;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** Inicia sesión con Cognito y valida que el usuario esté activo. */
  login: (email: string, password: string) => Promise<AuthUser>;
  /** Cierra la sesión de forma segura (limpia tokens locales). */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Construye el objeto de usuario a partir del ID token y el perfil de DynamoDB. */
async function loadUser(): Promise<AuthUser> {
  const { tokens } = await fetchAuthSession();
  const idToken = tokens?.idToken;

  if (!idToken) {
    throw new AuthUiError('No se pudo obtener la sesión. Vuelve a iniciar sesión.');
  }

  const payload = idToken.payload;
  const sub = String(payload['sub'] ?? '');
  const email = String(payload['email'] ?? '');
  const nombreFromToken = String(payload['name'] ?? email);
  const rolesFromToken = normalizeRoles(payload['cognito:groups']);

  try {
    const profile = await getSessionProfile(idToken.toString());

    // HU01: "Impedir el acceso a usuarios inactivos".
    if (profile.estado === 'inactivo') {
      await amplifySignOut();
      throw new AuthUiError('Usuario inactivo. Contacta al administrador del sistema.', false);
    }

    return {
      sub,
      email: profile.email || email,
      nombre: profile.nombre || nombreFromToken,
      roles: profile.rol ? [profile.rol] : rolesFromToken,
      rol: profile.rol || primaryRole(rolesFromToken),
    };
  } catch (error) {
    // Si el error vino de un usuario inactivo lo propagamos; si el backend está
    // caído o no responde, confiamos en el JWT de Cognito y seguimos adelante.
    if (error instanceof AuthUiError) throw error;
    return { sub, email, nombre: nombreFromToken, roles: rolesFromToken, rol: primaryRole(rolesFromToken) };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Restaura la sesión existente (si hay) al cargar la aplicación.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await getCurrentUser();
        const restored = await loadUser();
        if (!cancelled) {
          setUser(restored);
          setStatus('authenticated');
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    try {
      const result = await amplifySignIn({ username: email, password });

      if (!result.isSignedIn) {
        const step = result.nextStep?.signInStep;
        if (step === 'CONFIRM_SIGN_UP') {
          throw new AuthUiError('La cuenta aún no está verificada. Revisa tu correo para confirmarla.', false);
        }
        if (step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          throw new AuthUiError('Debes establecer una nueva contraseña para continuar.', false);
        }
        if (step === 'RESET_PASSWORD') {
          throw new AuthUiError('Debes restablecer tu contraseña para continuar.', false);
        }
        throw new AuthUiError('No se pudo iniciar sesión. Intenta de nuevo.', false);
      }

      const authenticatedUser = await loadUser();
      setUser(authenticatedUser);
      setStatus('authenticated');
      return authenticatedUser;
    } catch (error) {
      setStatus('unauthenticated');
      const retryable = error instanceof AuthUiError ? error.retryable : true;
      throw new AuthUiError(toAuthErrorMessage(error), retryable);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await amplifySignOut();
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout }),
    [user, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook para consumir el contexto de autenticación. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return context;
}
