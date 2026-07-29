import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, GraduationCap, Inbox, Sparkles } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { EncabezadoSeccion } from '@/components/ui/Decoraciones';
import { Hero } from '@/components/marketing/Hero';
import { CarruselImagenes } from '@/components/marketing/CarruselImagenes';
import { InsigniasConfianza } from '@/components/marketing/InsigniasConfianza';
import { useAniosDisponibles, usePlanesDelAnio } from '@/hooks/usePlanes';
import { useLandingPublico } from '@/hooks/useLanding';
import { mensajeDeError } from '@/hooks/useMensajeError';
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
 * Landing pública y paso previo al wizard. Se navega en tres pantallas
 * independientes (año → experiencias → detalle); cada una reemplaza a la
 * anterior, sin apilar todo en una sola página con scroll largo.
 */
export function SeleccionPlan({ alConfirmar, creando, error }: Props) {
  const [anio, setAnio] = useState<number | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);

  const anios = useAniosDisponibles();
  const planes = usePlanesDelAnio(anio);
  const landing = useLandingPublico();

  const planSeleccionado = planes.data?.find((plan) => plan.id === planId) ?? null;
  const imagenesAnio = (valor: number): string[] => landing.data?.anios[valor] ?? [];

  // Cada cambio de pantalla vuelve arriba: no hay que buscar nada scrolleando.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [anio, planId]);

  // ==========================================================================
  // Pantalla 3 — Detalle de la experiencia elegida
  // ==========================================================================
  if (planSeleccionado) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="mx-auto max-w-4xl space-y-5"
      >
        <button
          type="button"
          onClick={() => setPlanId(null)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-tinta-500 hover:text-tinta-800"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Ver otras experiencias
        </button>

        <Card>
          <CardHeader
            titulo={planSeleccionado.nombre}
            descripcion="Así se ve tu experiencia. Al lado, una vista del convenio que vas a firmar."
            icono={<Sparkles className="size-5" aria-hidden />}
            className="mb-4"
          />
          <div className="flex flex-col gap-4 sm:flex-row">
            {(planSeleccionado.presentacionUrl || planSeleccionado.imagenUrl) && (
              <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-tinta-200 bg-tinta-50">
                <img
                  src={planSeleccionado.presentacionUrl ?? planSeleccionado.imagenUrl ?? ''}
                  alt={`Experiencia ${planSeleccionado.nombre}`}
                  className="h-full max-h-104 w-full object-contain"
                />
              </div>
            )}

            {planSeleccionado.imagenUrl && (
              <div className="shrink-0 sm:w-40">
                <span className="mb-1.5 block text-xs font-medium text-tinta-500">Convenio</span>
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

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-oro-200 bg-white/95 p-4 shadow-elevada backdrop-blur sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-tinta-600">
            Vas a registrar con{' '}
            <strong className="text-tinta-900">{planSeleccionado.nombre}</strong> ·{' '}
            <span className="font-semibold text-oro-700">
              {formatearPesos(planSeleccionado.valor)}
            </span>
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
      </motion.div>
    );
  }

  // ==========================================================================
  // Pantalla 2 — Experiencias del año elegido
  // ==========================================================================
  if (anio !== null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="mx-auto max-w-4xl space-y-5"
      >
        <button
          type="button"
          onClick={() => setAnio(null)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-tinta-500 hover:text-tinta-800"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Cambiar de año
        </button>

        <Card>
          <CardHeader
            titulo={`Experiencias de ${anio}`}
            descripcion="Elige tu experiencia. Su convenio es el documento que se rellenará con tus datos."
            icono={<Sparkles className="size-5" aria-hidden />}
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
              titulo={`Sin experiencias en ${anio}`}
              descripcion="No hay experiencias activas con convenio cargado para ese año."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {planes.data.map((plan, indice) => (
                <motion.button
                  key={plan.id}
                  type="button"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: indice * 0.05, ease: 'easeOut' }}
                  whileHover={{ y: -3 }}
                  onClick={() => setPlanId(plan.id)}
                  className="overflow-hidden rounded-2xl border-2 border-tinta-200 text-left transition-colors hover:border-marca-300"
                >
                  <span className="relative block aspect-4/3 overflow-hidden bg-tinta-100">
                    {(plan.presentacionUrl ?? plan.imagenUrl) && (
                      <img
                        src={plan.presentacionUrl ?? plan.imagenUrl ?? ''}
                        alt={`Experiencia ${plan.nombre}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    )}
                  </span>

                  <span className="block p-4">
                    <span className="block font-display font-semibold text-tinta-900">
                      {plan.nombre}
                    </span>
                    <span className="texto-oro mt-0.5 block text-lg font-bold">
                      {formatearPesos(plan.valor)}
                    </span>
                    {plan.descripcion && (
                      <span className="mt-1 block text-xs text-tinta-500">{plan.descripcion}</span>
                    )}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    );
  }

  // ==========================================================================
  // Pantalla 1 — Landing: año
  // ==========================================================================
  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-10">
      <Hero imagenes={landing.data?.hero ?? []} />

      <section className="space-y-4 sm:space-y-6">
        <EncabezadoSeccion
          titulo="¿De qué prom eres?"
          descripcion={
            <>
              Selecciona tu año y descubre las experiencias que tenemos{' '}
              <span className="font-semibold text-marca-700">para ti</span>.
            </>
          }
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
            titulo="No hay experiencias disponibles"
            descripcion="El administrador debe crear al menos un plan activo y subir su convenio."
          />
        ) : (
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:gap-6">
            {[...anios.data]
              .sort((a, b) => a.anio - b.anio)
              .map((opcion, indice) => (
                <motion.button
                  key={opcion.anio}
                  type="button"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: indice * 0.08, ease: 'easeOut' }}
                  whileHover={{ y: -4 }}
                  onClick={() => {
                    setPlanId(null);
                    setAnio(opcion.anio);
                  }}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-tinta-200 bg-white text-center shadow-tarjeta transition-colors hover:border-oro-300"
                >
                  {/* Cabecera festiva con la insignia dorada */}
                  <span className="fondo-fiesta relative flex h-20 shrink-0 items-end justify-center sm:h-32">
                    {imagenesAnio(opcion.anio).length > 0 ? (
                      <>
                        <CarruselImagenes imagenes={imagenesAnio(opcion.anio)} />
                        <span className="absolute inset-0 bg-linear-to-t from-noche-950/90 via-noche-900/40 to-transparent" />
                      </>
                    ) : (
                      <span className="pointer-events-none absolute inset-0 opacity-60">
                        <span className="absolute -top-6 left-6 size-24 rounded-full bg-marca-500/30 blur-2xl" />
                        <span className="absolute -right-4 top-2 size-24 rounded-full bg-oro-400/20 blur-2xl" />
                      </span>
                    )}
                    <span className="relative -mb-6 grid size-12 place-items-center rounded-full border-2 border-oro-400 bg-noche-900 text-oro-300 shadow-[0_6px_18px_-6px_rgb(0_0_0/0.6)] sm:-mb-7 sm:size-16">
                      <span className="flex flex-col items-center leading-none">
                        <GraduationCap className="size-4 sm:size-5" aria-hidden />
                        <span className="mt-0.5 text-[10px] font-bold text-white sm:text-[11px]">
                          {opcion.anio}
                        </span>
                      </span>
                    </span>
                  </span>

                  <span className="flex flex-1 flex-col px-4 pt-7 pb-3 sm:px-5 sm:pt-9 sm:pb-5">
                    <span className="texto-oro block font-display text-3xl font-extrabold sm:text-5xl">
                      {opcion.anio}
                    </span>
                    <span className="mt-1 block text-xs text-tinta-500 sm:text-sm">
                      <span className="font-semibold text-marca-700">{opcion.total_planes}</span>{' '}
                      experiencia{opcion.total_planes === 1 ? '' : 's'} disponible
                      {opcion.total_planes === 1 ? '' : 's'}
                    </span>

                    <span className="mt-auto inline-flex w-full items-center justify-center gap-1 rounded-lg bg-linear-to-b from-marca-500 to-marca-700 px-2 py-2 text-[10px] font-semibold tracking-wide text-white uppercase transition-colors group-hover:from-marca-500 group-hover:to-marca-600 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm">
                      Ver experiencias
                      <ArrowRight className="size-3 sm:size-4" aria-hidden />
                    </span>
                  </span>
                </motion.button>
              ))}
          </div>
        )}

        <InsigniasConfianza />
      </section>
    </div>
  );
}
