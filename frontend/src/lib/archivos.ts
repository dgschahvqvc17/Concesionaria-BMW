import type { CategoriaArchivo } from '@/types/vehiculo';

export interface ReglasArchivo {
  tipos: string[];
  /** Valor para el atributo `accept` de un input file. */
  accept: string;
  maxBytes: number;
  /** Descripción legible de los formatos permitidos. */
  formatos: string;
}

/** Reglas de formato y tamaño por categoría (deben coincidir con el backend). */
export const REGLAS_ARCHIVO: Record<CategoriaArchivo, ReglasArchivo> = {
  foto: {
    tipos: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    accept: 'image/png,image/jpeg,image/webp,image/gif',
    maxBytes: 5 * 1024 * 1024,
    formatos: 'JPG, PNG, WEBP o GIF',
  },
  documento: {
    tipos: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt',
    maxBytes: 10 * 1024 * 1024,
    formatos: 'PDF, Word, Excel o TXT',
  },
};

/** Formatea un tamaño en bytes a una cadena legible (p. ej. 2.5 MB). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Valida un archivo contra las reglas de su categoría; devuelve el error o `null`. */
export function validarArchivo(file: File, categoria: CategoriaArchivo): string | null {
  const reglas = REGLAS_ARCHIVO[categoria];
  if (!reglas.tipos.includes(file.type)) {
    return `"${file.name}" no es un archivo permitido. Formatos: ${reglas.formatos}.`;
  }
  if (file.size > reglas.maxBytes) {
    return `"${file.name}" supera el tamaño máximo de ${formatBytes(reglas.maxBytes)}.`;
  }
  return null;
}
