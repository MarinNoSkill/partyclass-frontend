import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PropsEmptyState {
  icono: ReactNode;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  className?: string;
}

export function EmptyState({ icono, titulo, descripcion, accion, className }: PropsEmptyState) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <span className="grid size-14 place-items-center rounded-2xl bg-tinta-100 text-tinta-400">
        {icono}
      </span>
      <h3 className="mt-4 text-base font-semibold text-tinta-900">{titulo}</h3>
      {descripcion && (
        <p className="mt-1.5 max-w-sm text-sm text-tinta-500">{descripcion}</p>
      )}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}
