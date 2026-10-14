import { BadgeCheck, Fingerprint, Mail, ShieldCheck, UserRound } from 'lucide-react';

import { InfoTile } from '@/components/dashboard/InfoTile';
import { AppHeader } from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/brand';

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.rol];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <section className="relative animate-fade-in overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue-deep via-brand-blue-dark to-brand-blue-night p-8 text-white shadow-panel">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-blue/30 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-white/60">Panel de control</p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Bienvenido, {user.nombre}
              </h1>
              <p className="max-w-xl text-sm text-white/70">{ROLE_DESCRIPTIONS[user.rol]}</p>
            </div>
            <Badge className="w-fit gap-1.5 border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              {roleLabel}
            </Badge>
          </div>
        </section>

        <section className="grid animate-slide-up gap-4 sm:grid-cols-2">
          <InfoTile icon={UserRound} label="Nombre" value={user.nombre} />
          <InfoTile icon={Mail} label="Correo" value={user.email} />
          <InfoTile icon={ShieldCheck} label="Rol" value={roleLabel} />
          <InfoTile icon={Fingerprint} label="ID de usuario" value={user.sub} />
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
