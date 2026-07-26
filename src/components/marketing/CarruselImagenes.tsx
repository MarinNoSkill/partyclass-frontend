import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface Props {
  imagenes: string[];
  /** Milisegundos entre imágenes. */
  intervaloMs?: number;
  className?: string;
  imgClassName?: string;
  alt?: string;
}

/**
 * Fondo de imágenes que se cruzan en rotación. Si solo hay una, la muestra
 * fija. Pensado para ir dentro de un contenedor con `position: relative`.
 */
export function CarruselImagenes({
  imagenes,
  intervaloMs = 5000,
  className,
  imgClassName,
  alt = '',
}: Props) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (imagenes.length <= 1) return;
    const id = window.setInterval(
      () => setIndice((i) => (i + 1) % imagenes.length),
      intervaloMs,
    );
    return () => window.clearInterval(id);
  }, [imagenes.length, intervaloMs]);

  if (imagenes.length === 0) return null;

  const actual = imagenes[Math.min(indice, imagenes.length - 1)];

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden>
      <AnimatePresence mode="sync">
        <motion.img
          key={actual}
          src={actual}
          alt={alt}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className={cn('absolute inset-0 h-full w-full object-cover', imgClassName)}
        />
      </AnimatePresence>
    </div>
  );
}
