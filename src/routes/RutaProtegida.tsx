import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PantallaCargando } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Guarda de ruta del panel de administración.
 *
 * Es una barrera de UX, no de seguridad: la protección real está en el
 * middleware `requireAdmin` del backend. Sin JWT válido, la API no devuelve
 * ni un byte por mucho que alguien fuerce la ruta en el navegador.
 */
export function RutaProtegida() {
  const { autenticado, cargando } = useAuth();
  const ubicacion = useLocation();

  if (cargando) {
    return <PantallaCargando mensaje="Verificando sesión…" />;
  }

  if (!autenticado) {
    return <Navigate to="/admin/login" replace state={{ desde: ubicacion.pathname }} />;
  }

  return <Outlet />;
}
