import { Outlet } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';
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
    <div className="flex min-h-dvh flex-col bg-tinta-50">
      <header className="sticky top-0 z-30 border-b border-tinta-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-marca-600 text-white">
            <PartyPopper className="size-5" aria-hidden />
          </span>

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

      <Toaster />
    </div>
  );
}
