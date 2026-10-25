import { fetchAuthSession } from 'aws-amplify/auth';

import type { UserRole } from '@/lib/roles';

const API_URL = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export interface SessionProfile {
  userId: string;
  email: string;
  nombre: string;
  rol: UserRole;
  estado: 'activo' | 'inactivo';
}

/** Error de la API con código HTTP y detalles opcionales de validación. */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

/** Obtiene el ID token de la sesión activa de Cognito. */
async function getIdToken(): Promise<string> {
  const { tokens } = await fetchAuthSession();
  const token = tokens?.idToken?.toString();
  if (!token) {
    throw new ApiError('No hay una sesión activa.', 401);
  }
  return token;
}

/**
 * Realiza una petición autenticada a la API.
 * Adjunta el ID token de Cognito y normaliza los errores como ApiError.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = await getIdToken();
  const hasBody = options.body !== undefined;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error ?? 'Ocurrió un error inesperado.';
    throw new ApiError(message, res.status, (data as { details?: unknown } | null)?.details);
  }

  return data as T;
}

/** Petición pública sin token (p. ej. autorregistro de clientes). */
export async function publicRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error ?? 'Ocurrió un error inesperado.';
    throw new ApiError(message, res.status, (data as { details?: unknown } | null)?.details);
  }

  return data as T;
}

/** Mensaje de error legible a partir de cualquier excepción. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

/** Extrae los errores de validación por campo devueltos por el backend. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError && Array.isArray(error.details)) {
    return (error.details as Array<{ field?: string; message?: string }>).reduce<Record<string, string>>(
      (acc, detail) => {
        if (detail?.field && detail?.message) acc[detail.field] = detail.message;
        return acc;
      },
      {}
    );
  }
  return {};
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
