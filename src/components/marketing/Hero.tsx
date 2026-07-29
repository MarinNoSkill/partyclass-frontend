import { motion } from 'framer-motion';
import { CarruselImagenes } from './CarruselImagenes';
import { cn } from '@/utils/cn';

interface Props {
  /**
   * Imágenes de fondo que rotan. Las gestiona el admin desde «Inicio».
   * Sin ellas se usa un degradado festivo.
   */
  imagenes?: string[];
  className?: string;
}

/**
 * Banner principal del área pública: fondo festivo oscuro (o las imágenes que
 * suba el admin, en rotación), titular en display y un acento script dorado.
 */
export function Hero({ imagenes = [], className }: Props) {
  return (
    <section
      className={cn(
        'fondo-fiesta relative overflow-hidden rounded-3xl border border-white/10 shadow-elevada',
        className,
      )}
    >
      {imagenes.length > 0 && (
        <>
          <CarruselImagenes imagenes={imagenes} prioridad />
          <span className="absolute inset-0 bg-linear-to-t from-noche-950/95 via-noche-900/70 to-noche-800/60" />
        </>
      )}

      {/* Destellos */}
      <span className="pointer-events-none absolute -top-10 -left-6 size-40 rounded-full bg-marca-500/30 blur-3xl" aria-hidden />
      <span className="pointer-events-none absolute -right-8 top-4 size-40 rounded-full bg-oro-400/20 blur-3xl" aria-hidden />

      <div className="relative px-5 py-5 text-center sm:px-10 sm:py-16">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="font-display text-2xl font-extrabold tracking-tight text-white uppercase sm:text-4xl"
        >
          Tu último año
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="texto-oro -mt-1 font-script text-4xl leading-tight sm:text-6xl"
        >
          merece ser inolvidable
        </motion.p>

        <div className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-3 sm:mt-5" aria-hidden>
          <span className="divisor-oro flex-1" />
          <span className="size-1.5 rotate-45 bg-oro-400" />
          <span className="divisor-oro flex-1" />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold tracking-wide text-white/90 uppercase sm:mt-5 sm:text-base"
        >
          <span>Viajes</span>
          <span className="size-1 rounded-full bg-marca-400" />
          <span>Prom</span>
          <span className="size-1 rounded-full bg-marca-400" />
          <span>Experiencias</span>
        </motion.p>
      </div>
    </section>
  );
}
