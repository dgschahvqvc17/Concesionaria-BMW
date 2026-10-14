import type { UserRole } from '@/lib/roles';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export interface SessionProfile {
  userId: string;
  email: string;
  nombre: string;
  rol: UserRole;
  estado: 'activo' | 'inactivo';
}

/** Devuelve el perfil del usuario autenticado desde DynamoDB validando el JWT. */
export async function getSessionProfile(idToken: string): Promise<SessionProfile> {
  const res = await fetch(`${API_URL}/api/auth/session`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 401 || res.status === 403) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || 'No autorizado');
  }

  if (!res.ok) {
    throw new Error('No se pudo obtener la sesión del usuario.');
  }

  return (await res.json()) as SessionProfile;
}

export { API_URL };
