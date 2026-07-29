import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * Divisor decorativo con un rombo dorado central.
 * Marca el inicio de una sección con el acento de marca.
 */
export function DivisorOro({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3', className)} aria-hidden>
      <span className="divisor-oro w-16 sm:w-24" />
      <span className="size-2 rotate-45 rounded-[2px] bg-linear-to-br from-oro-300 to-oro-600 shadow-[0_0_8px_rgb(230_183_61/0.6)]" />
      <span className="divisor-oro w-16 sm:w-24" />
    </div>
  );
}

interface PropsEncabezado {
  titulo: ReactNode;
  descripcion?: ReactNode;
  /** Muestra el divisor dorado encima del título. */
  conDivisor?: boolean;
  className?: string;
}

/**
 * Encabezado de sección centrado, con título en tipografía display y un
 * divisor dorado opcional. Se usa en la landing y en cabeceras destacadas.
 */
export function EncabezadoSeccion({
  titulo,
  descripcion,
  conDivisor = true,
  className,
}: PropsEncabezado) {
  return (
    <div className={cn('text-center', className)}>
      {conDivisor && <DivisorOro className="mb-2 sm:mb-4" />}
      <h2 className="font-display text-xl font-bold tracking-tight text-tinta-900 sm:text-3xl">
        {titulo}
      </h2>
      {descripcion && (
        <p className="mx-auto mt-1 max-w-md text-[13px] text-tinta-500 sm:mt-2 sm:text-base">
          {descripcion}
        </p>
      )}
    </div>
  );
}
