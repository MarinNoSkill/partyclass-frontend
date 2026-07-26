import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type VarianteBoton =
  | 'primario'
  | 'secundario'
  | 'fantasma'
  | 'peligro'
  | 'contorno'
  | 'oro';
export type TamanoBoton = 'sm' | 'md' | 'lg';

const VARIANTES: Record<VarianteBoton, string> = {
  primario:
    'bg-linear-to-b from-marca-500 to-marca-700 text-white shadow-[0_6px_18px_-6px_rgb(124_58_237/0.6)] hover:from-marca-500 hover:to-marca-600 active:to-marca-800 disabled:from-marca-300 disabled:to-marca-300 disabled:shadow-none',
  oro:
    'bg-linear-to-b from-oro-400 to-oro-600 text-noche-900 shadow-[--shadow-oro] hover:from-oro-300 hover:to-oro-500 active:to-oro-700 disabled:from-oro-200 disabled:to-oro-200 disabled:text-oro-700/60 disabled:shadow-none',
  secundario:
    'bg-tinta-100 text-tinta-800 hover:bg-tinta-200 active:bg-tinta-300 disabled:text-tinta-400',
  contorno:
    'border border-tinta-300 bg-white text-tinta-700 hover:bg-tinta-50 hover:border-tinta-400 disabled:text-tinta-400',
  fantasma: 'text-tinta-600 hover:bg-tinta-100 hover:text-tinta-900 disabled:text-tinta-400',
  peligro: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
};

const TAMANOS: Record<TamanoBoton, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
};

export interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  cargando?: boolean;
  iconoIzquierda?: ReactNode;
  iconoDerecha?: ReactNode;
  anchoCompleto?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, PropsBoton>(function Button(
  {
    variante = 'primario',
    tamano = 'md',
    cargando = false,
    iconoIzquierda,
    iconoDerecha,
    anchoCompleto = false,
    className,
    children,
    disabled,
    type = 'button',
    ...resto
  },
  ref,
) {
  const inhabilitado = disabled || cargando;

  return (
    <button
      ref={ref}
      type={type}
      disabled={inhabilitado}
      aria-busy={cargando || undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600',
        'disabled:cursor-not-allowed select-none',
        // Micro-interacción: se hunde ligeramente al pulsar (salvo deshabilitado).
        !inhabilitado && 'active:scale-[0.97]',
        VARIANTES[variante],
        TAMANOS[tamano],
        anchoCompleto && 'w-full',
        className,
      )}
      {...resto}
    >
      {cargando ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        iconoIzquierda
      )}
      {children}
      {!cargando && iconoDerecha}
    </button>
  );
});
