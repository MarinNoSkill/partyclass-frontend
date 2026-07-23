import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PropsSpinner {
  className?: string;
  etiqueta?: string;
}

export function Spinner({ className, etiqueta = 'Cargando' }: PropsSpinner) {
  return (
    <Loader2
      role="status"
      aria-label={etiqueta}
      className={cn('size-5 animate-spin text-marca-600', className)}
    />
  );
}

export function PantallaCargando({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 py-16">
      <Spinner className="size-7" />
      <p className="text-sm text-tinta-500">{mensaje}</p>
    </div>
  );
}
