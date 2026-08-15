import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BarraInferior } from '@/components/layout/BarraInferior';

// Fondo de gala con un velo oscuro fuerte: da la temática sin restar
// legibilidad a las tarjetas de contenido que flotan encima.
const FONDO =
  'linear-gradient(to bottom, rgba(6,5,3,0.86), rgba(6,5,3,0.92)), url("/Imagen%20de%20fondo.png")';

/**
 * Marco de un módulo del panel. La navegación ya NO usa pestañas arriba: se
 * entra a un módulo desde el panel (donde están todos) y se vuelve con el botón
 * «Volver al panel». La barra inferior fija es la navegación principal.
 */
export function AdminLayout() {
  const { sesion } = useAuth();

  return (
    <div
      className="min-h-dvh bg-noche-950 bg-fixed bg-cover bg-center pb-24 text-white"
      style={{ backgroundImage: FONDO }}
    >
      <header className="sticky top-0 z-30 border-b border-oro-500/25 bg-black/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-lg border border-oro-500/30 bg-white/5 px-3 py-2 text-sm font-medium text-oro-200 transition-colors hover:border-oro-400 hover:bg-white/10"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span>Volver al panel</span>
          </Link>

          <Link to="/admin" className="ml-auto shrink-0" title="Ir al panel">
            <img
              src="/logo.webp"
              alt="PartyClass"
              className="h-9 w-auto drop-shadow-[0_2px_8px_rgb(0_0_0/0.4)]"
            />
          </Link>

          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-xs text-white/60">
              Sesión: <span className="text-oro-300">{sesion?.usuario}</span>
            </p>
          </div>
        </div>
      </header>

      <main className="tema-oro mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <BarraInferior />
    </div>
  );
}
