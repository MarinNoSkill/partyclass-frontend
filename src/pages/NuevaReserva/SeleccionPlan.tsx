import { useState } from 'react';
import { ArrowLeft, CalendarDays, Check, Inbox, Layers } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAniosDisponibles, usePlanesDelAnio } from '@/hooks/usePlanes';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { cn } from '@/utils/cn';
import type { PlanConImagen } from '@/types/planes.types';

interface Props {
  alConfirmar: (plan: PlanConImagen) => void;
  creando: boolean;
  error: string | null;
}

function formatearPesos(valor: string): string {
  return Number(valor).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

/**
 * Paso previo al wizard: año y plan.
 *
 * Va antes de crear la reserva, no dentro del stepper, porque el plan define
 * la plantilla del convenio y no debería poder cambiarse a mitad del proceso
 * con datos ya cargados.
 */
export function SeleccionPlan({ alConfirmar, creando, error }: Props) {
  const [anio, setAnio] = useState<number | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);

  const anios = useAniosDisponibles();
  const planes = usePlanesDelAnio(anio);

  const planSeleccionado = planes.data?.find((plan) => plan.id === planId) ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* --- Paso A: año --- */}
      <Card>
        <CardHeader
          titulo="Selecciona el año"
          descripcion="Solo aparecen los años con planes disponibles."
          icono={<CalendarDays className="size-5" aria-hidden />}
          className="mb-4"
        />

        {anios.isPending ? (
          <div className="grid place-items-center py-8">
            <Spinner />
          </div>
        ) : anios.isError ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {mensajeDeError(anios.error)}
          </p>
        ) : anios.data.length === 0 ? (
          <EmptyState
            icono={<Inbox className="size-6" aria-hidden />}
            titulo="No hay planes disponibles"
            descripcion="El administrador debe crear al menos un plan activo y subir su convenio."
          />
        ) : (
          <div className="flex flex-wrap gap-3">
            {anios.data.map((opcion) => (
              <button
                key={opcion.anio}
                type="button"
                onClick={() => {
                  setAnio(opcion.anio);
                  setPlanId(null);
                }}
                className={cn(
                  'rounded-xl border-2 px-6 py-4 text-left transition-all',
                  anio === opcion.anio
                    ? 'border-marca-600 bg-marca-50 shadow-sm'
                    : 'border-tinta-200 hover:border-tinta-300 hover:bg-tinta-50',
                )}
              >
                <span className="block text-2xl font-semibold text-tinta-900">
                  {opcion.anio}
                </span>
                <span className="text-xs text-tinta-500">
                  {opcion.total_planes} plan{opcion.total_planes === 1 ? '' : 'es'}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* --- Paso B: plan --- */}
      {anio !== null && (
        <Card>
          <CardHeader
            titulo={`Planes de ${anio}`}
            descripcion="Elige el plan. Su convenio es el documento que se rellenará con los datos."
            icono={<Layers className="size-5" aria-hidden />}
            className="mb-4"
          />

          {planes.isPending ? (
            <div className="grid place-items-center py-8">
              <Spinner />
            </div>
          ) : planes.isError ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {mensajeDeError(planes.error)}
            </p>
          ) : planes.data.length === 0 ? (
            <EmptyState
              icono={<Inbox className="size-6" aria-hidden />}
              titulo={`Sin planes en ${anio}`}
              descripcion="No hay planes activos con convenio cargado para ese año."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {planes.data.map((plan) => {
                const activo = planId === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setPlanId(plan.id)}
                    className={cn(
                      'overflow-hidden rounded-xl border-2 text-left transition-all',
                      activo
                        ? 'border-marca-600 shadow-md'
                        : 'border-tinta-200 hover:border-tinta-300',
                    )}
                  >
                    <span className="relative block aspect-[4/3] bg-tinta-100">
                      {plan.imagenUrl && (
                        <img
                          src={plan.imagenUrl}
                          alt={`Convenio de ${plan.nombre}`}
                          className="h-full w-full object-cover"
                        />
                      )}
                      {activo && (
                        <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-marca-600 text-white shadow">
                          <Check className="size-4" aria-hidden />
                        </span>
                      )}
                    </span>

                    <span className="block p-4">
                      <span className="block font-medium text-tinta-900">{plan.nombre}</span>
                      <span className="mt-0.5 block text-sm font-medium text-marca-700">
                        {formatearPesos(plan.valor)}
                      </span>
                      {plan.descripcion && (
                        <span className="mt-1 block text-xs text-tinta-500">
                          {plan.descripcion}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* --- Confirmación --- */}
      {planSeleccionado && (
        <div className="sticky bottom-4 flex flex-col gap-3 rounded-xl border border-tinta-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-tinta-600">
            Vas a registrar con{' '}
            <strong className="text-tinta-900">{planSeleccionado.nombre}</strong> ·{' '}
            {formatearPesos(planSeleccionado.valor)}
          </p>

          <div className="flex gap-2">
            <Button
              variante="secundario"
              onClick={() => setPlanId(null)}
              disabled={creando}
              iconoIzquierda={<ArrowLeft className="size-4" aria-hidden />}
            >
              Cambiar
            </Button>
            <Button cargando={creando} onClick={() => alConfirmar(planSeleccionado)}>
              Comenzar registro
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
