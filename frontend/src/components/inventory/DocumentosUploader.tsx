import { useRef, useState } from 'react';
import { FileText, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api';
import { REGLAS_ARCHIVO, formatBytes, validarArchivo } from '@/lib/archivos';
import { vehiculosService } from '@/services/vehiculos';
import type { VehiculoDocumento } from '@/types/vehiculo';

interface DocumentosUploaderProps {
  documentos: VehiculoDocumento[];
  onChange: (documentos: VehiculoDocumento[]) => void;
  disabled?: boolean;
}

const MAX_DOCUMENTOS = 20;

/** Selector y subida de documentos autorizados del vehículo (subida directa a S3). */
export function DocumentosUploader({
  documentos,
  onChange,
  disabled = false,
}: DocumentosUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    if (documentos.length + fileList.length > MAX_DOCUMENTOS) {
      toast.error(`Puedes registrar hasta ${MAX_DOCUMENTOS} documentos.`);
      return;
    }

    setUploading(true);
    const subidos: VehiculoDocumento[] = [];
    try {
      for (const file of Array.from(fileList)) {
        const error = validarArchivo(file, 'documento');
        if (error) {
          toast.error(error);
          continue;
        }
        const subido = await vehiculosService.subirArchivo(file, 'documento');
        subidos.push({ ...subido, url: URL.createObjectURL(file) });
      }
      if (subidos.length > 0) {
        onChange([...documentos, ...subidos]);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (key: string) => onChange(documentos.filter((documento) => documento.key !== key));

  return (
    <div className="space-y-3">
      {documentos.length > 0 && (
        <ul className="space-y-2">
          {documentos.map((documento) => (
            <li
              key={documento.key}
              className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{documento.nombre}</p>
                  {typeof documento.size === 'number' && (
                    <p className="text-xs text-muted-foreground">{formatBytes(documento.size)}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {documento.url && (
                  <Button type="button" variant="ghost" size="sm" asChild>
                    <a href={documento.url} target="_blank" rel="noopener noreferrer">
                      Ver
                    </a>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(documento.key)}
                  disabled={disabled}
                  aria-label={`Quitar ${documento.nombre}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading || documentos.length >= MAX_DOCUMENTOS}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Paperclip className="h-4 w-4" aria-hidden="true" />
        )}
        {uploading ? 'Subiendo…' : 'Agregar documento'}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept={REGLAS_ARCHIVO.documento.accept}
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <p className="text-xs text-muted-foreground">
        {documentos.length}/{MAX_DOCUMENTOS} documentos. Formatos:{' '}
        {REGLAS_ARCHIVO.documento.formatos}. Tamaño máximo:{' '}
        {formatBytes(REGLAS_ARCHIVO.documento.maxBytes)}.
      </p>
    </div>
  );
}
