import { useState } from 'react';
import { ImageOff, ZoomIn } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { VehiculoFoto } from '@/types/vehiculo';

interface VehiculoGaleriaProps {
  marca: string;
  modelo: string;
  fotos: VehiculoFoto[];
}

/** Galería de fotografías del vehículo con ampliación a pantalla completa (HU05). */
export function VehiculoGaleria({ marca, modelo, fotos }: VehiculoGaleriaProps) {
  const [activa, setActiva] = useState(0);
  const [ampliada, setAmpliada] = useState(false);
  const titulo = `${marca} ${modelo}`;
  const fotoActiva = fotos[activa];

  if (!fotoActiva) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-border/70 bg-muted text-muted-foreground">
        <ImageOff className="h-10 w-10" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setAmpliada(true)}
        className="group relative block w-full overflow-hidden rounded-2xl border border-border/70 bg-muted"
      >
        <img src={fotoActiva.url} alt={titulo} className="aspect-[4/3] w-full object-cover" />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
          Ampliar
        </span>
      </button>

      {fotos.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {fotos.map((foto, index) => (
            <button
              key={foto.key}
              type="button"
              onClick={() => setActiva(index)}
              className={cn(
                'overflow-hidden rounded-lg border-2 transition-colors',
                index === activa ? 'border-primary' : 'border-transparent hover:border-border'
              )}
              aria-label={`Ver fotografía ${index + 1} de ${fotos.length}`}
            >
              <img
                src={foto.url}
                alt={`${titulo} ${index + 1}`}
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={ampliada} onOpenChange={setAmpliada}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{titulo}</DialogTitle>
          </DialogHeader>
          <img src={fotoActiva.url} alt={titulo} className="max-h-[85vh] w-full rounded-xl object-contain" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
