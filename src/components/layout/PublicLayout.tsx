import { Outlet, NavLink } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Toaster } from '@/components/ui/Toaster';
import { config } from '@/utils/config';

/**
 * Marco del área operativa.
 *
 * Solo contiene el registro de estudiantes. Todo lo demás —listados,
 * dashboard, planes, numeración y configuración— vive en `/admin`, detrás de
 * la sesión de administrador: quien atiende a un estudiante no tiene por qué
 * ver los datos del resto.
 *
 * Sin sidebar: con una única sección, una barra de navegación solo añadiría
 * ruido y ocuparía espacio que el formulario aprovecha mejor.
 *
 * Tampoco hay enlace a administración: se entra escribiendo /admin a mano.
 * Es una medida de discreción, no de seguridad: la protección real la dan la
 * guarda RutaProtegida en el cliente y el middleware requireAdmin del backend,
 * que sigue devolviendo 401 sin JWT válido aunque alguien descubra la ruta.
 */
export function PublicLayout() {
  const anioActual = new Date().getFullYear();

  return (
    <div className="fondo-crema flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-oro-200/60 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <img src="/logo.webp" alt="PartyClass" className="h-9 w-auto shrink-0 sm:h-11" />

          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-tinta-900 sm:text-base">
              {config.appName}
            </p>
            <p className="truncate text-[11px] font-medium tracking-wide text-oro-700 sm:text-xs">
              Experiencias {anioActual} – {anioActual + 1}
            </p>
          </div>

          <NavLink
            to="/autorizaciones"
            className={({ isActive }) =>
              `ml-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-oro-300 bg-oro-50 text-oro-800'
                  : 'border-oro-200 text-oro-800 hover:bg-oro-50'
              }`
            }
          >
            <ShieldCheck className="size-4" aria-hidden />
            <span className="hidden sm:inline">Autorizaciones</span>
          </NavLink>
        </div>
        <div className="divisor-oro" aria-hidden />
      </header>

      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:py-8">
        <div className="mx-auto w-full max-w-5xl">
          <Outlet />
        </div>
      </main>

      <footer className="mt-4 border-t border-oro-200/60 bg-noche-900 py-5 text-center">
        <p className="text-xs text-white/70">
          © {anioActual} <span className="font-semibold text-oro-300">PartyClass</span> · Tu
          viaje de grados y prom VIP
        </p>
      </footer>

      <Toaster />
    </div>
  );
}
