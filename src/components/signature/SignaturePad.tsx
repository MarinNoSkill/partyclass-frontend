import { useImperativeHandle, forwardRef } from 'react';
import { Eraser, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSignaturePad } from '@/hooks/useSignaturePad';
import { cn } from '@/utils/cn';

export interface ManejadorSignaturePad {
  limpiar: () => void;
  exportarPng: () => string | null;
  estaVacio: () => boolean;
}

interface PropsSignaturePad {
  /** Etiqueta accesible del lienzo, p. ej. "Firma del padre". */
  etiqueta: string;
  deshabilitado?: boolean;
  alCambiar?: (tieneTrazo: boolean) => void;
  className?: string;
}

/**
 * Lienzo de firma puro: dibuja, limpia y exporta.
 * No conoce la API ni el dominio — eso lo resuelve SignatureCard.
 */
export const SignaturePad = forwardRef<ManejadorSignaturePad, PropsSignaturePad>(
  function SignaturePad({ etiqueta, deshabilitado = false, alCambiar, className }, ref) {
    const { canvasRef, contenedorRef, estaVacio, limpiar, exportarPng, manejadores } =
      useSignaturePad();

    useImperativeHandle(ref, () => ({
      limpiar,
      exportarPng,
      estaVacio: () => estaVacio,
    }));

    const alTerminarTrazo: typeof manejadores.onPointerUp = (evento) => {
      manejadores.onPointerUp(evento);
      alCambiar?.(!estaVacio);
    };

    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <div
          ref={contenedorRef}
          className={cn(
            'relative h-44 w-full overflow-hidden rounded-xl border-2 border-dashed bg-white transition-colors sm:h-52',
            deshabilitado ? 'border-tinta-200 bg-tinta-50' : 'border-tinta-300',
          )}
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={etiqueta}
            className={cn('lienzo-firma absolute inset-0 size-full', deshabilitado && 'pointer-events-none')}
            {...manejadores}
            onPointerUp={alTerminarTrazo}
            onPointerLeave={alTerminarTrazo}
          />

          {/* Línea guía y marca de agua, solo cuando el lienzo está vacío. */}
          {estaVacio && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5">
              <PenLine className="size-6 text-tinta-300" aria-hidden />
              <p className="text-sm text-tinta-400">
                {deshabilitado ? 'Firma no disponible' : 'Firma aquí con el dedo o el ratón'}
              </p>
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-x-8 bottom-8 border-b border-tinta-200"
            aria-hidden
          />
        </div>

        <div className="flex justify-end">
          <Button
            variante="fantasma"
            tamano="sm"
            onClick={() => {
              limpiar();
              alCambiar?.(false);
            }}
            disabled={deshabilitado || estaVacio}
            iconoIzquierda={<Eraser className="size-4" aria-hidden />}
          >
            Limpiar
          </Button>
        </div>
      </div>
    );
  },
);
