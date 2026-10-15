import { BadgeCheck, Car, Fingerprint, Mail, ShieldCheck, UserRound, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { BmwRoundel } from '@/components/brand/BmwRoundel';
import { MStripe } from '@/components/brand/MStripe';
import { InfoTile } from '@/components/dashboard/InfoTile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/brand';

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.rol];
  const esAdmin = user.roles.includes('admin');

  return (
    <div className="space-y-8">
      <section className="relative animate-panel-in overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue-night via-brand-blue-deep to-brand-blue-dark p-7 text-white shadow-panel sm:p-9">
        <div
          className="pointer-events-none absolute inset-0 bg-sidebar-grid bg-grid opacity-30"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 top-0 h-1 bg-m-gradient" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-brand-blue/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-m-red/20 blur-3xl"
          aria-hidden="true"
        />
        <BmwRoundel
          className="pointer-events-none absolute -bottom-12 -right-6 hidden h-56 w-56 opacity-[0.07] sm:block"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55">
              <MStripe className="h-3.5 w-8" />
              Panel de control
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Bienvenido, {user.nombre}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-white/70">
              {ROLE_DESCRIPTIONS[user.rol]}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Badge className="gap-1.5 border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                {roleLabel}
              </Badge>
              <Badge className="gap-2 border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-400/15">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                Sesión activa
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="bg-white text-brand-blue-deep hover:bg-white/90">
              <Link to="/inventario">
                <Car className="h-4 w-4" aria-hidden="true" />
                Ver inventario
              </Link>
            </Button>
            {esAdmin && (
              <Button
                asChild
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/usuarios">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Gestionar usuarios
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="grid animate-slide-up gap-4 sm:grid-cols-2">
        <InfoTile icon={UserRound} label="Nombre" value={user.nombre} />
        <InfoTile icon={Mail} label="Correo" value={user.email} />
        <InfoTile icon={ShieldCheck} label="Rol" value={roleLabel} />
        <InfoTile icon={Fingerprint} label="ID de usuario" value={user.sub} />
      </section>
    </div>
  );
}

export default DashboardPage;
