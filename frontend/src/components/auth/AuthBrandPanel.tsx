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
    <aside className="relative hidden overflow-hidden border-r border-white/5 bg-gradient-to-br from-brand-blue-night via-[#0a2c55] to-brand-blue-deep lg:flex lg:w-1/2">
      <div className="absolute inset-x-0 top-0 h-1 bg-m-gradient" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-sidebar-grid bg-grid opacity-40"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-blue/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-m-red/20 blur-3xl"
        aria-hidden="true"
      />
      <BmwRoundel
        className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 opacity-[0.05]"
        title=""
      />

      <div className="relative z-10 flex h-full w-full flex-col justify-between p-12 text-white">
        <header className="flex items-center gap-3">
          <BmwRoundel className="h-10 w-10" />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">{APP_NAME}</p>
            <p className="text-xs text-white/50">{APP_TAGLINE}</p>
          </div>
        </header>

        <div className="max-w-md space-y-6">
          <MStripe className="h-1.5 w-16" />
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            El placer de conducir, ahora en tu sistema de gestión.
          </h1>
          <p className="text-sm leading-relaxed text-white/70">
            Administra el catálogo de vehículos BMW, tus clientes y tus ventas desde un solo lugar
            seguro.
          </p>
          <ul className="space-y-3 text-sm text-white/80">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-m-red" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} {APP_NAME}. Práctica académica.
        </p>
      </div>
    </aside>
  );
}
