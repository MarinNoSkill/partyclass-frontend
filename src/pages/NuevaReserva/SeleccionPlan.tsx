import { useState } from 'react';
import { motion } from 'framer-motion';
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
              {planes.data.map((plan, indice) => {
                const activo = planId === plan.id;

                return (
                  <motion.button
                    key={plan.id}
                    type="button"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: indice * 0.05, ease: 'easeOut' }}
                    whileHover={{ y: -3 }}
                    onClick={() => setPlanId(plan.id)}
                    className={cn(
                      'overflow-hidden rounded-xl border-2 text-left transition-colors',
                      activo
                        ? 'border-marca-600 shadow-lg shadow-marca-600/10'
                        : 'border-tinta-200 hover:border-marca-300',
                    )}
                  >
                    <span className="relative block aspect-4/3 overflow-hidden bg-tinta-100">
                      {(plan.presentacionUrl ?? plan.imagenUrl) && (
                        <img
                          src={plan.presentacionUrl ?? plan.imagenUrl ?? ''}
                          alt={`Plan ${plan.nombre}`}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
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
                  </motion.button>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* --- Detalle del plan elegido: presentación grande + convenio pequeño al lado --- */}
      {planSeleccionado && (planSeleccionado.presentacionUrl || planSeleccionado.imagenUrl) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Card>
            <CardHeader
              titulo={planSeleccionado.nombre}
              descripcion="Así se ve tu plan. Al lado, una vista del convenio que vas a firmar."
              icono={<Layers className="size-5" aria-hidden />}
              className="mb-4"
            />
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Imagen de presentación: grande */}
              <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-tinta-200 bg-tinta-50">
                <img
                  src={planSeleccionado.presentacionUrl ?? planSeleccionado.imagenUrl ?? ''}
                  alt={`Plan ${planSeleccionado.nombre}`}
                  className="h-full max-h-104 w-full object-contain"
                />
              </div>

              {/* Convenio: pequeño, al lado */}
              {planSeleccionado.imagenUrl && (
                <div className="shrink-0 sm:w-40">
                  <span className="mb-1.5 block text-xs font-medium text-tinta-500">
                    Convenio
                  </span>
                  <div className="overflow-hidden rounded-lg border border-tinta-200 bg-white">
                    <img
                      src={planSeleccionado.imagenUrl}
                      alt={`Convenio de ${planSeleccionado.nombre}`}
                      className="h-auto w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
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
