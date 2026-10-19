import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { CatalogoShell } from '@/components/catalog/CatalogoShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
import { STAFF_ROLES } from '@/lib/roles';
import { CatalogoPage } from '@/pages/CatalogoPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { LoginPage } from '@/pages/LoginPage';
import { RepuestosPage } from '@/pages/RepuestosPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { UsersPage } from '@/pages/UsersPage';
import { VehiculoDetallePage } from '@/pages/VehiculoDetallePage';
import { ClienteComercialDetallePage } from '@/pages/clientesComerciales/ClienteComercialDetallePage';
import { ClientesComercialesPage } from '@/pages/clientesComerciales/ClientesComercialesPage';
import { CotizacionesPage } from '@/pages/cotizaciones/CotizacionesPage';
import { ReservasPage } from '@/pages/reservas/ReservasPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/no-autorizado" element={<UnauthorizedPage />} />

          {/* Catálogo web público (HU05): usa la barra lateral si hay sesión. */}
          <Route element={<CatalogoShell />}>
            <Route path="/catalogo" element={<CatalogoPage />} />
            <Route path="/catalogo/:vehiculoId" element={<VehiculoDetallePage />} />
          </Route>

          {/* Rutas protegidas: comparten la estructura con barra lateral */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Secciones internas: no accesibles para clientes. */}
              <Route element={<ProtectedRoute roles={[...STAFF_ROLES]} />}>
                <Route path="/inventario" element={<InventoryPage />} />
                <Route path="/repuestos" element={<RepuestosPage />} />
              </Route>

              {/* Seguimiento comercial (HU07), cotizaciones (HU08) y reservas (HU09):
                  admin y vendedores. */}
              <Route element={<ProtectedRoute roles={['admin', 'vendedor']} />}>
                <Route path="/clientes-comerciales" element={<ClientesComercialesPage />} />
                <Route path="/clientes-comerciales/:clienteId" element={<ClienteComercialDetallePage />} />
                <Route path="/cotizaciones" element={<CotizacionesPage />} />
                <Route path="/reservas" element={<ReservasPage />} />
              </Route>

              {/* Gestión de usuarios: solo administradores. */}
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/usuarios" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
