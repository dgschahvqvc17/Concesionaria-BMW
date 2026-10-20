import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Check, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

import { VehiculoGaleria } from '@/components/catalog/VehiculoGaleria';
import { PruebaManejoFormDialog } from '@/components/pruebasManejo/PruebaManejoFormDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCatalogoVehiculo } from '@/hooks/useCatalogo';
import { getErrorMessage } from '@/lib/api';
import { esVehiculoParaPrueba } from '@/lib/pruebasManejo';
import {
  CONDICION_LABELS,
  ESTADO_LABELS,
  ESTADO_STYLES,
  TIPO_LABELS,
  formatKilometraje,
  formatPrecio,
} from '@/lib/vehiculos';
import { pruebasManejoService } from '@/services/pruebasManejo';
import type { CreatePruebaManejoInput } from '@/types/pruebaManejo';

/** Página de detalle público de un vehículo del catálogo (HU05). */
export function VehiculoDetallePage() {
  const { vehiculoId } = useParams<{ vehiculoId: string }>();
  const { vehiculo, loading, error } = useCatalogoVehiculo(vehiculoId);

  const [pruebaOpen, setPruebaOpen] = useState(false);
  const [solicitando, setSolicitando] = useState(false);

  const solicitarPrueba = async (input: CreatePruebaManejoInput) => {
    setSolicitando(true);
    try {
      await pruebasManejoService.solicitar(input);
      toast.success('Solicitud enviada. El equipo comercial se pondrá en contacto para confirmarla.');
      setPruebaOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    } finally {
      setSolicitando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Cargando vehículo…
      </div>
    );
  }

  if (error || !vehiculo) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Vehículo no disponible</h1>
        <p className="text-sm text-muted-foreground">
          {error ?? 'El vehículo que buscas no se encuentra publicado en el catálogo.'}
        </p>
        <Button asChild variant="outline">
          <Link to="/catalogo">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al catálogo
          </Link>
        </Button>
      </div>
    );
  }

  const caracteristicas = vehiculo.caracteristicas ?? [];
  const puedePrueba = esVehiculoParaPrueba(vehiculo);

  return (
    <div className="space-y-6">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al catálogo
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="animate-fade-in">
          <VehiculoGaleria marca={vehiculo.marca} modelo={vehiculo.modelo} fotos={vehiculo.fotos} />
        </div>

        <div className="animate-slide-up space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={ESTADO_STYLES[vehiculo.estado]}>{ESTADO_LABELS[vehiculo.estado]}</Badge>
              <Badge variant="secondary">{CONDICION_LABELS[vehiculo.condicion]}</Badge>
              <Badge variant="outline">{TIPO_LABELS[vehiculo.tipo]}</Badge>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {vehiculo.marca}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {vehiculo.modelo} {vehiculo.anio}
            </h1>
            <p className="text-sm text-muted-foreground">{vehiculo.version}</p>
            <p className="text-3xl font-semibold text-brand-blue-deep">{formatPrecio(vehiculo.precio)}</p>
          </div>

          <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-border/70 bg-card p-5 text-sm shadow-card">
            <div>
              <dt className="text-muted-foreground">Año</dt>
              <dd className="font-medium">{vehiculo.anio}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Kilometraje</dt>
              <dd className="font-medium">{formatKilometraje(vehiculo.kilometraje)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Color</dt>
              <dd className="font-medium">{vehiculo.color}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tipo</dt>
              <dd className="font-medium">{TIPO_LABELS[vehiculo.tipo]}</dd>
            </div>
          </dl>

          {vehiculo.descripcion && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Descripción
              </h2>
              <p className="text-sm leading-relaxed text-foreground/80">{vehiculo.descripcion}</p>
            </div>
          )}

          {caracteristicas.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Características principales
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {caracteristicas.map((caracteristica) => (
                  <li key={caracteristica} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
                    <span>{caracteristica}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-border/70 bg-brand-blue-ice/60 p-5">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                ¿Te interesa este vehículo? Inicia sesión para contactar con un vendedor.
              </p>
              <Button asChild>
                <Link to="/login">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Contactar a un vendedor
                </Link>
              </Button>
            </div>

            {puedePrueba && (
              <div className="space-y-3 border-t border-border/70 pt-3">
                <p className="text-sm text-muted-foreground">
                  Agenda una prueba de manejo sin compromiso: de 8:00 a 18:00, de lunes a sábado.
                </p>
                <Button variant="outline" className="bg-background" onClick={() => setPruebaOpen(true)}>
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  Solicitar prueba de manejo
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <PruebaManejoFormDialog
        open={pruebaOpen}
        onOpenChange={setPruebaOpen}
        vehiculos={[]}
        vehiculoFijo={vehiculo}
        onSubmit={solicitarPrueba}
        loading={solicitando}
      />
    </div>
  );
}

export default VehiculoDetallePage;
