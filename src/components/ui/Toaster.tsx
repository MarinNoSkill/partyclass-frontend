import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToast, type TipoToast } from '@/contexts/ToastContext';

const ICONOS: Record<TipoToast, typeof Info> = {
  exito: CheckCircle2,
  error: XCircle,
  info: Info,
  advertencia: AlertTriangle,
};

const COLORES: Record<TipoToast, string> = {
  exito: 'text-emerald-600',
  error: 'text-red-600',
  info: 'text-marca-600',
  advertencia: 'text-amber-600',
};

/** Pila de notificaciones. Vive una sola vez, en el layout raíz. */
export function Toaster() {
  const { toasts, cerrar } = useToast();

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notificaciones"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[80] flex flex-col gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icono = ICONOS[toast.tipo];

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-tinta-200 bg-white p-3.5 shadow-[0_10px_40px_-12px_rgb(15_23_42/0.25)]"
            >
              <Icono className={`mt-0.5 size-5 shrink-0 ${COLORES[toast.tipo]}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-tinta-900">{toast.titulo}</p>
                {toast.descripcion && (
                  <p className="mt-0.5 text-sm break-words text-tinta-500">{toast.descripcion}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => cerrar(toast.id)}
                aria-label="Cerrar notificación"
                className="rounded-lg p-1 text-tinta-400 transition-colors hover:bg-tinta-100 hover:text-tinta-700"
              >
                <X className="size-4" aria-hidden />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
