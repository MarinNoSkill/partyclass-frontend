import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Hash,
  Layers,
  LayoutDashboard,
  LogOut,
  Settings,
  Table2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

const SECCIONES = [
  { etiqueta: 'Resumen', ruta: '/admin', icono: LayoutDashboard, exacta: true },
  { etiqueta: 'Registros', ruta: '/admin/registros', icono: Table2 },
  { etiqueta: 'Planes', ruta: '/admin/planes', icono: Layers },
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
      <header className="bg-tinta-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/95 p-1">
            <img src="/logo.webp" alt="PartyClass" className="h-full w-auto" />
          </span>

          <div className="mr-auto min-w-0">
            <p className="text-sm font-semibold">Panel de administración</p>
            <p className="truncate text-xs text-tinta-400">
              Sesión: {sesion?.usuario}
            </p>
          </div>

          <NavLink
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-tinta-300 transition-colors hover:bg-tinta-800 hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span className="hidden sm:inline">Ir al registro</span>
          </NavLink>

          <button
            type="button"
            onClick={salir}
            className="inline-flex items-center gap-1.5 rounded-lg bg-tinta-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
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
                        ? 'border-marca-400 text-white'
                        : 'border-transparent text-tinta-400 hover:text-white',
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
