import { CatalogoLayout } from '@/components/catalog/CatalogoLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';

/**
 * Estructura del catálogo web según la sesión (HU05/HU06):
 * los usuarios autenticados conservan la navegación interna (barra lateral);
 * los visitantes anónimos ven el layout público con el botón de iniciar sesión.
 */
export function CatalogoShell() {
  const { status } = useAuth();
  return status === 'authenticated' ? <AppLayout /> : <CatalogoLayout />;
}

export default CatalogoShell;
