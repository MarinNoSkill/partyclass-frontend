import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  Hash,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  LogOut,
  Settings,
  ShieldOff,
  Table2,
  UserRoundCog,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

const SECCIONES = [
  { etiqueta: 'Panel', ruta: '/admin', icono: LayoutGrid, exacta: true },
  { etiqueta: 'Dashboard', ruta: '/admin/dashboard', icono: LayoutDashboard },
  { etiqueta: 'Registros', ruta: '/admin/registros', icono: Table2 },
  { etiqueta: 'Planes', ruta: '/admin/planes', icono: Layers },
  { etiqueta: 'Documentos', ruta: '/admin/documentos', icono: ShieldOff },
  { etiqueta: 'Representantes', ruta: '/admin/representantes', icono: UserRoundCog },
  { etiqueta: 'Numeración', ruta: '/admin/numeracion', icono: Hash },
  { etiqueta: 'Configuración', ruta: '/admin/configuracion', icono: Settings },
];

/**
 * Marco del panel de administración. Es visualmente distinto del área
 * operativa (barra oscura) para que quede claro que se está en un contexto
 * con sesión iniciada y datos sensibles a la vista.
 */
export function AdminLayout() {
  const { sesion, logout } = useAuth();
  const navegar = useNavigate();

  const salir = () => {
    logout();
    navegar('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-tinta-50">
      <header className="fondo-fiesta text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/admin" className="shrink-0" title="Ir al panel">
            <img
              src="/logo.webp"
              alt="PartyClass"
              className="h-10 w-auto drop-shadow-[0_2px_8px_rgb(0_0_0/0.4)]"
            />
          </Link>

          <div className="mr-auto min-w-0">
            <p className="font-display text-sm font-bold">Panel de administración</p>
            <p className="truncate text-xs text-white/60">
              Sesión: <span className="text-oro-300">{sesion?.usuario}</span>
            </p>
          </div>

          <NavLink
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="size-4" aria-hidden />
            <span className="hidden sm:inline">Ir al registro</span>
          </NavLink>

          <button
            type="button"
            onClick={salir}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>

        <nav className="mx-auto max-w-7xl px-4 sm:px-6">
          <ul className="flex gap-1 overflow-x-auto">
            {SECCIONES.map((seccion) => (
              <li key={seccion.ruta}>
                <NavLink
                  to={seccion.ruta}
                  end={seccion.exacta ?? false}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                      isActive
                        ? 'border-oro-400 text-oro-200'
                        : 'border-transparent text-white/55 hover:text-white',
                    )
                  }
                >
                  <seccion.icono className="size-4" aria-hidden />
                  {seccion.etiqueta}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
