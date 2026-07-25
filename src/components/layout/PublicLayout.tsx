import { Outlet } from 'react-router-dom';
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
  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-marca-50/60 via-tinta-50 to-tinta-50">
      <header className="sticky top-0 z-30 border-b border-tinta-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <img src="/logo.webp" alt="PartyClass" className="h-10 w-auto shrink-0 sm:h-11" />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-tinta-900">{config.appName}</p>
            <p className="truncate text-xs text-tinta-500">Registro de convenios</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <div className="mx-auto w-full max-w-5xl">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-tinta-200/70 py-4 text-center">
        <p className="text-xs text-tinta-400">
          © {new Date().getFullYear()} PartyClass · Tu viaje de grados y prom VIP
        </p>
      </footer>

      <Toaster />
    </div>
  );
}
