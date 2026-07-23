import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PropsCard extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  sinRelleno?: boolean;
}

export function Card({ children, className, sinRelleno = false, ...resto }: PropsCard) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-tinta-200 bg-white shadow-[0_1px_3px_0_rgb(15_23_42/0.06),0_8px_24px_-8px_rgb(15_23_42/0.08)]',
        !sinRelleno && 'p-5 sm:p-6',
        className,
      )}
      {...resto}
    >
      {children}
    </div>
  );
}

interface PropsCardHeader {
  titulo: string;
  descripcion?: string;
  icono?: ReactNode;
  acciones?: ReactNode;
  className?: string;
}

export function CardHeader({ titulo, descripcion, icono, acciones, className }: PropsCardHeader) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icono && (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-marca-50 text-marca-600">
            {icono}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-tinta-900">{titulo}</h2>
          {descripcion && (
            <p className="mt-0.5 text-sm text-tinta-500">{descripcion}</p>
          )}
        </div>
      </div>
      {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
    </div>
  );
}
