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
      className="relative min-h-dvh bg-noche-950 bg-fixed bg-cover bg-center text-white"
      style={{ backgroundImage: FONDO }}
    >
      <div className="mx-auto max-w-5xl px-4 pt-8 pb-28 sm:pt-12">
        {/* --- Encabezado --- */}
        <header className="text-center">
          <img
            src="/logopartyclass.png"
            alt="PartyClass"
            className="mx-auto h-16 w-auto drop-shadow-[0_4px_16px_rgba(230,183,61,0.35)] sm:h-20"
          />
          <p className="mt-1 font-display text-sm font-semibold tracking-[0.35em] text-oro-200 uppercase sm:text-base">
            Panel administrativo
          </p>
          <div className="mx-auto mt-2 flex items-center justify-center gap-1.5 text-oro-400">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-oro-500/70" />
            <span className="text-xs">★ ★ ★ ★ ★</span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-oro-500/70" />
          </div>
        </header>

        {/* --- Bienvenida --- */}
        <div className="mt-7 flex items-center gap-4 rounded-2xl border border-oro-500/25 bg-black/45 px-5 py-4 backdrop-blur-sm">
          <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-oro-400/70 text-oro-300">
            <UserRound className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold text-white sm:text-xl">¡Bienvenido!</h1>
            <p className="text-sm text-white/60">
              Selecciona el módulo al que deseas ingresar.
              {sesion?.usuario && (
                <span className="hidden sm:inline"> · Sesión: <span className="text-oro-300">{sesion.usuario}</span></span>
              )}
            </p>
          </div>
        </div>

        {/* --- Módulos --- */}
        <section className="relative mt-12 sm:mt-14">
          {/* Escenario circular dorado que envuelve TODOS los módulos (decorativo). */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -z-0 h-[118%] w-[116%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-oro-500/35 bg-[radial-gradient(ellipse_at_center,_rgba(230,183,61,0.12),_transparent_68%)] shadow-[0_0_90px_-24px_rgba(230,183,61,0.55)]"
          />
          {/* Arco superior brillante, como el horizonte del salón. */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-[-9%] left-1/2 -z-0 h-[118%] w-[116%] -translate-x-1/2 rounded-[50%] border-t-2 border-oro-300/60"
          />

          <div className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10">
          {MODULOS.map((m) => (
            <Link
              key={m.ruta}
              to={m.ruta}
              className="group flex flex-col items-center gap-3 focus:outline-none"
            >
              <span className="grid size-28 place-items-center rounded-full border-2 border-oro-400/70 bg-gradient-to-b from-white/5 to-black/40 shadow-[0_0_25px_-4px_rgba(230,183,61,0.45)] transition-all duration-200 group-hover:scale-105 group-hover:border-oro-300 group-hover:shadow-[0_0_38px_-2px_rgba(230,183,61,0.7)] group-focus-visible:border-oro-300 sm:size-32">
                <img
                  src={m.icono}
                  alt=""
                  className="size-20 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] sm:size-24"
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

      {/* --- Barra inferior --- */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-oro-500/25 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-stretch justify-around px-2 py-2">
          <ItemBarra to="/admin" icono={Home} etiqueta="Inicio" fin />
          <ItemBarra to="/admin/configuracion" icono={Settings} etiqueta="Configuración" />
          <ItemBarra to="/" icono={ExternalLink} etiqueta="Registro" />
          <button
            type="button"
            onClick={salir}
            className="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
   