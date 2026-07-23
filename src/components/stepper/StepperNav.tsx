import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PropsStepperNav {
  puedeRetroceder: boolean;
  puedeAvanzar: boolean;
  esUltimoPaso: boolean;
  cargando?: boolean;
  etiquetaAvanzar?: string;
  etiquetaRetroceder?: string;
  alRetroceder: () => void;
  alAvanzar: () => void;
  mensajeBloqueo?: string;
}

/** Barra de navegación del wizard, fija en la parte inferior de cada paso. */
export function StepperNav({
  puedeRetroceder,
  puedeAvanzar,
  esUltimoPaso,
  cargando = false,
  etiquetaAvanzar,
  etiquetaRetroceder,
  alRetroceder,
  alAvanzar,
  mensajeBloqueo,
}: PropsStepperNav) {
  const etiqueta = etiquetaAvanzar ?? (esUltimoPaso ? 'Finalizar registro' : 'Continuar');

  return (
    <div className="flex flex-col gap-3 border-t border-tinta-200 pt-5">
      {!puedeAvanzar && mensajeBloqueo && (
        <p className="text-sm text-amber-700" role="status">
          {mensajeBloqueo}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-between">
        <Button
          variante="contorno"
          onClick={alRetroceder}
          disabled={!puedeRetroceder || cargando}
          iconoIzquierda={<ArrowLeft className="size-4" aria-hidden />}
        >
          {etiquetaRetroceder ?? 'Atrás'}
        </Button>

        <Button
          onClick={alAvanzar}
          disabled={!puedeAvanzar}
          cargando={cargando}
          iconoDerecha={
            esUltimoPaso ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <ArrowRight className="size-4" aria-hidden />
            )
          }
        >
          {etiqueta}
        </Button>
      </div>
    </div>
  );
}
