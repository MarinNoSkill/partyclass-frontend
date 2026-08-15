import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ExternalLink, Home, LogOut, Settings, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

/** Módulos del panel. Cada icono 3D vive en /public con el nombre del módulo. */
const MODULOS = [
  { icono: '/Resumen.png', titulo: 'Dashboard', sub: 'Resumen general', ruta: '/admin/dashboard' },
  { icono: '/Registros.png', titulo: 'Registros', sub: 'Reservas y convenios', ruta: '/admin/registros' },
  { icono: '/Planes.png', titulo: 'Planes', sub: 'Planes y precios', ruta: '/admin/planes' },
  { icono: '/Numeracion.png', titulo: 'Numeración', sub: 'Boletas de sorteo', ruta: '/admin/numeracion' },
  { icono: '/Representantes.png', titulo: 'Representantes', sub: 'Módulo de representantes', ruta: '/admin/representantes' },
  { icono: '/documentos.png', titulo: 'Documentos', sub: 'Documentos bloqueados', ruta: '/admin/documentos' },
] as const;

// Estos iconos traen su propio círculo dentro de la imagen, así que se ven más
// pequeños: se agrandan para igualar el tamaño visual de los demás.
const ICONO_GRANDE = new Set<string>(['Planes', 'Representantes']);

const FONDO =
  'linear-gradient(to bottom, rgba(8,6,4,0.55), rgba(8,6,4,0.35) 45%, rgba(8,6,4,0.8)), url("/Imagen%20de%20fondo.png")';

/**
 * Pantalla de inicio del panel administrativo: un lanzador de módulos con el
 * estilo negro/dorado de gala. Cada módulo abre su sección; la barra inferior
 * lleva a inicio, configuración, el registro público y cerrar sesión.
 */
export function PanelInicio() {
  const { sesion, logout } = useAuth();
  const navegar = useNavigate();

  const salir = () => {
    logout();
    navegar('/admin/login', { replace: true });
  };

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-x-hidden bg-noche-950 bg-fixed bg-cover bg-center text-white md:h-dvh md:overflow-hidden"
      style={{ backgroundImage: FONDO }}
    >
      {/* --- Encabezado (sobre el fondo de gala) --- */}
      <header className="px-4 pt-5 text-center sm:pt-7">
        <img
          src="/logopartyclass.png"
          alt="PartyClass"
          className="mx-auto h-16 w-auto drop-shadow-[0_4px_16px_rgba(230,183,61,0.35)] sm:h-20"
        />
        <p className="mt-1 font-display text-sm font-semibold tracking-[0.35em] text-oro-200 uppercase sm:text-base">
          Panel administrativo
        </p>
        <div className="mx-auto mt-2 flex items-center justify-center gap-1.5 text-oro-400">
          <span className="h-px w-10 bg-linear-to-r from-transparent to-oro-500/70" />
          <span className="text-xs">★ ★ ★ ★ ★</span>
          <span className="h-px w-10 bg-linear-to-l from-transparent to-oro-500/70" />
        </div>
      </header>

      {/* --- Escenario negro: ocupa TODO el alto restante para evitar scroll --- */}
      <div className="relative mt-3 flex-1 sm:mt-4">
        {/* Panel NEGRO con arco dorado, a lo ANCHO de la pantalla y hasta abajo.
            Solo en escritorio; en móvil los módulos van sobre el fondo de gala. */}
        <svg
          aria-hidden
          viewBox="0 0 1600 900"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-y-0 left-1/2 z-0 hidden w-screen -translate-x-1/2 md:block"
        >
          <defs>
            <radialGradient id="glintArco" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffdf5" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#f4e09a" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#e6b73d" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M0,90 Q800,-16 1600,90 L1600,900 L0,900 Z" fill="#050505" />
          <path
            d="M0,90 Q800,-16 1600,90"
            fill="none"
            stroke="#e6b73d"
            strokeOpacity="0.75"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {/* Brillo en la punta superior del arco (como el reflejo de un anillo). */}
          <ellipse cx="800" cy="37" rx="70" ry="22" fill="url(#glintArco)" />
        </svg>

        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col px-4 pt-20 pb-24 sm:pt-24">
          {/* Bienvenida (dentro del arco) */}
          <div className="flex items-center gap-4 rounded-2xl border border-oro-500/25 bg-black/45 px-5 py-4 backdrop-blur-sm">
            <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-oro-400/70 text-oro-300">
              <UserRound className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold text-white sm:text-xl">¡Bienvenido!</h1>
              <p className="text-sm text-white/60">
                Selecciona el módulo al que deseas ingresar.
                {sesion?.usuario && (
                  <span className="hidden sm:inline">
                    {' '}
                    · Sesión: <span className="text-oro-300">{sesion.usuario}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Módulos, centrados en el espacio que queda (sin scroll). */}
          <div className="grid flex-1 content-center grid-cols-2 gap-x-4 gap-y-8 py-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 sm:py-8">
            {MODULOS.map((m) => (
                <Link
                  key={m.ruta}
                  to={m.ruta}
                  className="group flex flex-col items-center gap-3 focus:outline-none"
                >
                  <span className="grid size-28 place-items-center rounded-full border-2 border-oro-400/70 bg-linear-to-b from-white/5 to-black/40 shadow-[0_0_25px_-4px_rgba(230,183,61,0.45)] transition-all duration-200 group-hover:scale-105 group-hover:border-oro-300 group-hover:shadow-[0_0_38px_-2px_rgba(230,183,61,0.7)] group-focus-visible:border-oro-300 sm:size-32">
                    <img
                      src={m.icono}
                      alt=""
                      className={cn(
                        'object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]',
                        ICONO_GRANDE.has(m.titulo) ? 'size-24 sm:size-28' : 'size-20 sm:size-24',
                      )}
                    />
                  </span>
                  <div className="text-center">
                    <p className="font-display text-sm font-bold tracking-wide text-white uppercase">
                      {m.titulo}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium tracking-wider text-oro-300/80 uppercase">
                      {m.sub}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

      {/* --- Barra inferior (fija y por encima de todo) --- */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-oro-500/25 bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-stretch justify-around px-2 py-2">
          <ItemBarra to="/admin" icono={Home} etiqueta="Inicio" fin />
          <ItemBarra to="/admin/configuracion" icono={Settings} etiqueta="Configuración" />
          <ItemBarra to="/" icono={ExternalLink} etiqueta="Registro" />
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
    </div>
  );
}

function ItemBarra({
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
