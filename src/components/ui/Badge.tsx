import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import type { EstadoReserva } from '@/types/dominio.types';
import { ETIQUETA_ESTADO } from '@/utils/formato';

export type TonoBadge = 'neutro' | 'marca' | 'exito' | 'alerta' | 'peligro';

const TONOS: Record<TonoBadge, string> = {
  neutro: 'bg-tinta-100 text-tinta-700 ring-tinta-200',
  marca: 'bg-marca-50 text-marca-700 ring-marca-200',
  exito: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  alerta: 'bg-amber-50 text-amber-700 ring-amber-200',
  peligro: 'bg-red-50 text-red-700 ring-red-200',
};

interface PropsBadge {
  children: ReactNode;
  tono?: TonoBadge;
  className?: string;
}

export function Badge({ children, tono = 'neutro', className }: PropsBadge) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        TONOS[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}

const TONO_POR_ESTADO: Record<EstadoReserva, TonoBadge> = {
  BORRADOR: 'alerta',
  COMPLETADA: 'exito',
  ANULADA: 'peligro',
};

export function BadgeEstado({ estado }: { estado: EstadoReserva }) {
  return (
    <Badge tono={TONO_POR_ESTADO[estado]}>
      <span
        className={cn('size-1.5 rounded-full', {
          'bg-amber-500': estado === 'BORRADOR',
          'bg-emerald-500': estado === 'COMPLETADA',
          'bg-red-500': estado === 'ANULADA',
        })}
        aria-hidden
      />
      {ETIQUETA_ESTADO[estado]}
    </Badge>
  );
}
