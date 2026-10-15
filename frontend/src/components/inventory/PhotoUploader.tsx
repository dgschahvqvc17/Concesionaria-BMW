import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api';
import { vehiculosService } from '@/services/vehiculos';
import type { VehiculoFoto } from '@/types/vehiculo';

interface PhotoUploaderProps {
  fotos: VehiculoFoto[];
  onChange: (fotos: VehiculoFoto[]) => void;
  disabled?: boolean;
}

const MAX_FOTOS = 15;

/** Selector y subida de fotografías del vehículo (subida directa a S3). */
export function PhotoUploader({ fotos, onChange, disabled = false }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    if (fotos.length + fileList.length > MAX_FOTOS) {
      toast.error(`Puedes registrar hasta ${MAX_FOTOS} fotografías.`);
      return;
    }

    setUploading(true);
    const subidas: VehiculoFoto[] = [];
    try {
      for (const file of Array.from(fileList)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`"${file.name}" no es un archivo de imagen.`);
          continue;
        }
        const key = await vehiculosService.uploadFoto(file);
        subidas.push({ key, url: URL.createObjectURL(file) });
      }
      if (subidas.length > 0) {
        onChange([...fotos, ...subidas]);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (key: string) => onChange(fotos.filter((foto) => foto.key !== key));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {fotos.map((foto) => (
          <div key={foto.key} className="group relative h-24 w-32 overflow-hidden rounded-md border bg-muted">
            <img src={foto.url} alt="Fotografía del vehículo" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(foto.key)}
              disabled={disabled}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 disabled:hidden"
              aria-label="Eliminar fotografía"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading || fotos.length >= MAX_FOTOS}
          className="flex h-[74px] w-[110px] flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          )}
          <span>{uploading ? 'Subiendo…' : 'Agregar foto'}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {fotos.length}/{MAX_FOTOS} fotografías. Formatos: JPG, PNG, WEBP o GIF.
        </p>
        {fotos.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])} disabled={disabled}>
            Quitar todas
          </Button>
        )}
      </div>
    </div>
  );
}
