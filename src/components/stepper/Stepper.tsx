import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface DefinicionPaso {
  numero: number;
  titulo: string;
  descripcion: string;
}

export const PASOS_RESERVA: DefinicionPaso[] = [
  { numero: 1, titulo: 'Estudiante', descripcion: 'Datos del estudiante' },
  { numero: 2, titulo: 'Acudientes', descripcion: 'Padre y madre' },
  { numero: 3, titulo: 'Firmas', descripcion: 'Firmas digitales' },
  { numero: 4, titulo: 'Confirmación', descripcion: 'Convenio PDF' },
];

interface PropsStepper {
  pasos: DefinicionPaso[];
  pasoActual: number;
  pasoMaximoAlcanzado: number;
  alSeleccionar?: (paso: number) => void;
}

/**
 * Indicador de progreso del wizard.
 * En escritorio muestra la línea completa; en móvil colapsa a una barra
 * compacta para no robar altura al formulario.
 */
export function Stepper({ pasos, pasoActual, pasoMaximoAlcanzado, alSeleccionar }: PropsStepper) {
  const pasoVisible = pasos.find((paso) => paso.numero === pasoActual);
  const progreso = ((pasoActual - 1) / (pasos.length - 1)) * 100;

  return (
    <div className="w-full">
      {/* --- Móvil --- */}
      <div className="lg:hidden">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-tinta-900">
            {pasoVisible?.titulo ?? ''}
          </p>
          <p className="text-xs font-medium text-tinta-500">
            Paso {pasoActual} de {pasos.length}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-tinta-500">{pasoVisible?.descripcion}</p>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-tinta-200">
          <motion.div
            className="h-full rounded-full bg-marca-600"
            initial={false}
            animate={{ width: `${Math.max(progreso, 6)}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* --- Escritorio --- */}
      <ol className="hidden lg:flex lg:items-start">
        {pasos.map((paso, indice) => {
          const completado = paso.numero < pasoActual;
          const activo = paso.numero === pasoActual;
          const accesible = paso.numero <= pasoMaximoAlcanzado;
          const esUltimo = indice === pasos.length - 1;

          return (
            <li key={paso.numero} className={cn('flex flex-1', esUltimo && 'flex-none')}>
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!accesible || !alSeleccionar}
                  onClick={() => alSeleccionar?.(paso.numero)}
                  aria-current={activo ? 'step' : undefined}
                  aria-label={`Paso ${paso.numero}: ${paso.titulo}`}
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold transition-all duration-200',
                    completado && 'border-marca-600 bg-marca-600 text-white',
                    activo &&
                      'border-marca-600 bg-white text-marca-700 ring-4 ring-marca-100',
                    !completado && !activo && 'border-tinta-300 bg-white text-tinta-400',
                    accesible && alSeleccionar
                      ? 'cursor-pointer hover:border-marca-500'
                      : 'cursor-default',
                  )}
                >
                  {completado ? <Check className="size-5" aria-hidden /> : paso.numero}
                </button>

                <div className="mt-2 w-32 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium transition-colors',
                      activo || completado ? 'text-tinta-900' : 'text-tinta-400',
                    )}
                  >
                    {paso.titulo}
                  </p>
                  <p className="mt-0.5 text-xs text-tinta-400">{paso.descripcion}</p>
                </div>
              </div>

              {!esUltimo && (
                <div className="mt-5 h-0.5 flex-1 bg-tinta-200" aria-hidden>
                  <motion.div
                    className="h-full bg-marca-600"
                    initial={false}
                    animate={{ width: completado ? '100%' : '0%' }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
