import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PropsModal {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  pie?: ReactNode;
  tamano?: 'sm' | 'md' | 'lg' | 'xl';
}

const TAMANOS = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

export function Modal({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  children,
  pie,
  tamano = 'md',
}: PropsModal) {
  useEffect(() => {
    if (!abierto) return;

    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar();
    };

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', alPulsar);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', alPulsar);
    };
  }, [abierto, alCerrar]);

  return createPortal(
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={alCerrar}
            className="absolute inset-0 bg-tinta-900/50 backdrop-blur-[2px]"
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_10px_40px_-12px_rgb(15_23_42/0.35)] sm:rounded-2xl',
              TAMANOS[tamano],
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-tinta-200 px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-tinta-900">{titulo}</h2>
                {descripcion && (
                  <p className="mt-0.5 text-sm text-tinta-500">{descripcion}</p>
                )}
              </div>
              <button
                type="button"
                onClick={alCerrar}
                aria-label="Cerrar"
                className="rounded-lg p-1.5 text-tinta-400 transition-colors hover:bg-tinta-100 hover:text-tinta-700"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="barra-scroll-fina min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {children}
            </div>

            {pie && (
              <div className="flex flex-col-reverse gap-2 border-t border-tinta-200 bg-tinta-50 px-5 py-3.5 sm:flex-row sm:justify-end">
                {pie}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
