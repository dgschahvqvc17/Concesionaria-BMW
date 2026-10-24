/**
 * Traduce las excepciones de Cognito/Amplify a mensajes entendibles en español,
 * tal como lo exige la HU01 ("Mostrar un mensaje cuando las credenciales sean incorrectas").
 */

export class AuthUiError extends Error {
  /** true cuando el usuario debe poder reintentar (credenciales, rate limit, etc.). */
  readonly retryable: boolean;

  constructor(message: string, retryable = true) {
    super(message);
    this.name = 'AuthUiError';
    this.retryable = retryable;
  }
}

interface Mapping {
  name: string;
  message: string;
  retryable?: boolean;
}

const MAP: Mapping[] = [
  {
    name: 'NotAuthorizedException',
    message: 'El correo electrónico o la contraseña son incorrectos.',
  },
  {
    name: 'UserNotFoundException',
    message: 'No existe una cuenta asociada a ese correo electrónico.',
  },
  {
    name: 'UserNotConfirmedException',
    message: 'La cuenta aún no está verificada. Revisa tu correo para confirmarla.',
  },
  {
    name: 'PasswordResetRequiredException',
    message: 'La contraseña debe restablecerse antes de iniciar sesión.',
  },
  {
    name: 'InvalidPasswordException',
    message: 'La contraseña no cumple con los requisitos de seguridad.',
  },
  {
    name: 'UserLambdaValidationException',
    message: 'Usuario inactivo. Contacta al administrador del sistema.',
  },
  {
    name: 'LimitExceededException',
    message: 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
  },
  {
    name: 'TooManyRequestsException',
    message: 'Demasiadas solicitudes. Espera unos minutos y vuelve a intentarlo.',
  },
  {
    name: 'NetworkError',
    message: 'No se pudo conectar con el servicio de autenticación. Verifica tu conexión.',
  },
];

/** Convierte cualquier error lanzado por Amplify/Cognito en un mensaje amigable. */
export function toAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthUiError) return error.message;

  const err = error as { name?: string; message?: string };

  if (err?.name) {
    const found = MAP.find((m) => m.name === err.name);
    if (found) return found.message;
  }

  // Errores de red de fetch / fetchAuthSession
  if (err?.name === 'TypeError' && /fetch/i.test(err.message ?? '')) {
    return 'No se pudo conectar con el servicio de autenticación. Verifica tu conexión.';
  }

  return err?.message ?? 'Ocurrió un error inesperado al iniciar sesión.';
}
