import { NavLink, useNavigate } from 'react-router-dom';
import { ExternalLink, Home, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

/**
 * Barra inferior fija del panel administrativo. Es la navegación principal:
 * lleva al panel (donde están todos los módulos), a configuración, al registro
 * público y a cerrar sesión. Se mantiene por encima de todo el contenido.
 */
export function BarraInferior() {
  const { logout } = useAuth();
  const navegar = useNavigate();

  const salir = () => {
    logout();
    navegar('/admin/login', { replace: true });
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-oro-500/25 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-stretch justify-around px-2 py-2">
        <Item to="/admin" icono={Home} etiqueta="Inicio" fin />
        <Item to="/admin/configuracion" icono={Settings} etiqueta="Configuración" />
        <Item to="/" icono={ExternalLink} etiqueta="Registro" />
        <button
          type="button"
          onClick={salir}
          className="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="size-5" aria-hidden />
          <span className="uppercase tracking-wide">Salir</span>
        </button>
      </div>
    </nav>
  );
}

function Item({
  to,
  icono: Icono,
  etiqueta,
  fin,
}: {
  to: string;
  icono: typeof Home;
  etiqueta: string;
  fin?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={fin}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors',
          isActive ? 'text-oro-300' : 'text-white/60 hover:text-white',
        )
      }
    >
      <Icono className="size-5" aria-hidden />
      <span className="uppercase tracking-wide">{etiqueta}</span>
    </NavLink>
  );
}
