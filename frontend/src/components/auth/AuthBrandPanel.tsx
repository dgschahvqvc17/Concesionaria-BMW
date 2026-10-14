import { BmwRoundel } from '@/components/brand/BmwRoundel';
import { MStripe } from '@/components/brand/MStripe';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';

const HIGHLIGHTS = [
  'Acceso seguro con Amazon Cognito',
  'Roles y permisos según tu perfil',
  'Gestión integral de vehículos y ventas',
];

/** Panel lateral de marca (visible en pantallas grandes). */
export function AuthBrandPanel() {
  return (
    <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-deep via-brand-blue-dark to-brand-blue-night" />
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-blue/30 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-m-blue/20 blur-3xl" />

      <header className="relative z-10 flex items-center gap-3">
        <BmwRoundel className="h-11 w-11" />
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-tight">{APP_NAME}</p>
          <p className="text-[0.7rem] uppercase tracking-[0.28em] text-white/55">{APP_TAGLINE}</p>
        </div>
      </header>

      <div className="relative z-10 space-y-6">
        <MStripe className="h-1.5 w-16" />
        <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
          El placer de conducir, ahora en tu sistema de gestión.
        </h1>
        <p className="max-w-md text-sm text-white/70">
          Administra el catálogo de vehículos BMW, tus clientes y tus ventas desde un solo lugar
          seguro.
        </p>
        <ul className="space-y-3 text-sm text-white/80">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-m-red" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-xs text-white/40">
        © {new Date().getFullYear()} {APP_NAME}. Práctica académica.
      </p>
    </aside>
  );
}
