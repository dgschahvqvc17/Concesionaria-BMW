import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Car,
  CarFront,
  Contact,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';

import { BmwRoundel } from '@/components/brand/BmwRoundel';
import { MStripe } from '@/components/brand/MStripe';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { APP_NAME, APP_TAGLINE, ROLE_LABELS } from '@/lib/brand';
import { STAFF_ROLES, type UserRole } from '@/lib/roles';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Si se indica, la ruta solo es visible para estos roles. */
  roles?: UserRole[];
}

const STAFF_NAV_ROLES: UserRole[] = [...STAFF_ROLES];

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/catalogo', label: 'Catálogo', icon: CarFront },
  { to: '/inventario', label: 'Inventario', icon: Car, roles: STAFF_NAV_ROLES },
  { to: '/repuestos', label: 'Repuestos', icon: Package, roles: STAFF_NAV_ROLES },
  { to: '/clientes-comerciales', label: 'Clientes', icon: Contact, roles: ['admin', 'vendedor'] },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText, roles: ['admin', 'vendedor'] },
  { to: '/usuarios', label: 'Usuarios', icon: Users, roles: ['admin'] },
];

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

function NavLinks() {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.some((role) => user.roles.includes(role)))
  );

  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-white/10 text-white shadow-inset'
                : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand-blue-electric transition-all duration-200',
                  isActive ? 'opacity-100' : 'opacity-0'
                )}
              />
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </>
  );
}

function SidebarFooter() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="m-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-blue-deep text-sm font-semibold text-white ring-1 ring-white/20">
          {iniciales(user.nombre)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{user.nombre}</p>
          <p className="truncate text-xs text-white/50">{ROLE_LABELS[user.rol]}</p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          title="Cerrar sesión"
          className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

/** Marca y navegación de la barra lateral (compartida escritorio/móvil). */
function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 pb-4 pt-6">
        <BmwRoundel className="h-9 w-9" />
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-white">{APP_NAME}</p>
          <p className="hidden text-xs text-white/50 sm:block">{APP_TAGLINE}</p>
        </div>
        <MStripe className="ml-auto hidden h-5 w-9 lg:inline-flex" />
      </div>

      <div className="mx-6 border-t border-white/10" />

      <p className="px-6 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">
        Navegación
      </p>

      <nav className="flex-1 space-y-1 px-3">
        <NavLinks />
      </nav>

      <SidebarFooter />
    </div>
  );
}

/** Estructura de la aplicación autenticada: barra lateral + área de contenido. */
export function AppLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Fondo decorativo con malla de degradados BMW */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-bmw-mesh" aria-hidden="true" />

      {/* Barra lateral (escritorio) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 overflow-hidden border-r border-white/5 bg-gradient-to-b from-brand-blue-night via-[#0a2c55] to-brand-blue-deep lg:block">
        <div
          className="pointer-events-none absolute inset-0 bg-sidebar-grid bg-grid opacity-40"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-brand-blue/30 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative h-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Cabecera móvil */}
      <header className="glass sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <BmwRoundel className="h-8 w-8" />
          <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </header>

      {/* Cajón de navegación móvil */}
      <div
        className={cn('fixed inset-0 z-40 lg:hidden', menuOpen ? 'pointer-events-auto' : 'pointer-events-none')}
        aria-hidden={!menuOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-brand-blue-ink/60 backdrop-blur-sm transition-opacity duration-300',
            menuOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-72 overflow-hidden bg-gradient-to-b from-brand-blue-night via-[#0a2c55] to-brand-blue-deep shadow-2xl transition-transform duration-300 ease-out',
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-sidebar-grid bg-grid opacity-40"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="absolute right-3 top-3 z-10 rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="relative h-full">
            <SidebarContent />
          </div>
        </div>
      </div>

      {/* Área de contenido */}
      <div className="lg:pl-72">
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
