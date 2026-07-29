import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, GraduationCap, Inbox, Sparkles } from 'lucide-react';
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
 * Landing pública y paso previo al wizard: año y experiencia (plan).
 *
 * Va antes de crear la reserva, no dentro del stepper, porque el plan define
 * la plantilla del convenio y no debería poder cambiarse a mitad del proceso.
 */
export function SeleccionPlan({ alConfirmar, creando, error }: Props) {
  const [anio, setAnio] = useState<number | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const seccionPlanesRef = useRef<HTMLDivElement>(null);
  const detalleRef = useRef<HTMLDivElement>(null);

  const anios = useAniosDisponibles();
  const planes = usePlanesDelAnio(anio);
  const landing = useLandingPublico();

  // Al elegir un año, baja solo hasta las experiencias: el usuario no tiene
  // que buscar la sección manualmente.
  useEffect(() => {
    if (anio === null) return;
    // Pequeño margen para que la sección ya esté montada antes de desplazarse.
    const id = window.setTimeout(() => {
      seccionPlanesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(id);
  }, [anio]);

  // Al elegir una experiencia, baja solo hasta su detalle (presentación + convenio).
  useEffect(() => {
    if (planId === null) return;
    const id = window.setTimeout(() => {
      detalleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(id);
  }, [planId]);

  const planSeleccionado = planes.data?.find((plan) => plan.id === planId) ?? null;
  const imagenesAnio = (valor: number): string[] => landing.data?.anios[valor] ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <Hero imagenes={landing.data?.hero ?? []} />

      {/* --- Paso A: año --- */}
      <section className="space-y-6">
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
          <div className="grid gap-5 sm:grid-cols-2">
            {[...anios.data]
              .sort((a, b) => a.anio - b.anio)
              .map((opcion, indice) => {
              const activo = anio === opcion.anio;
              return (
                <motion.button
                  key={opcion.anio}
                  type="button"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: indice * 0.08, ease: 'easeOut' }}
                  whileHover={{ y: -4 }}
                  onClick={() => {
                    setAnio(opcion.anio);
                    setPlanId(null);
                  }}
                  className={cn(
                    'group overflow-hidden rounded-3xl border bg-white text-center shadow-tarjeta transition-colors',
                    activo
                      ? 'border-oro-400 ring-2 ring-oro-300'
                      : 'border-tinta-200 hover:border-oro-300',
                  )}
                >
                  {/* Cabecera festiva con la insignia dorada */}
                  <span className="fondo-fiesta relative flex h-32 items-end justify-center">
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
                    <span className="relative -mb-7 grid size-16 place-items-center rounded-full border-2 border-oro-400 bg-noche-900 text-oro-300 shadow-[0_6px_18px_-6px_rgb(0_0_0/0.6)]">
                      <span className="flex flex-col items-center leading-none">
                        <GraduationCap className="size-5" aria-hidden />
                        <span className="mt-0.5 text-[11px] font-bold text-white">
                          {opcion.anio}
                        </span>
                      </span>
                    </span>
                  </span>

                  <span className="block px-5 pt-9 pb-5">
                    <span className="texto-oro block font-display text-5xl font-extrabold">
                      {opcion.anio}
                    </span>
                    <span className="mt-1 block text-sm text-tinta-500">
                      <span className="font-semibold text-marca-700">{opcion.total_planes}</span>{' '}
                      experiencia{opcion.total_planes === 1 ? '' : 's'} disponible
                      {opcion.total_planes === 1 ? '' : 's'}
                    </span>

                    <span
                      className={cn(
                        'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide uppercase transition-colors',
                        activo
                          ? 'bg-linear-to-b from-oro-400 to-oro-600 text-noche-900'
                          : 'bg-linear-to-b from-marca-500 to-marca-700 text-white group-hover:from-marca-500 group-hover:to-marca-600',
                      )}
                    >
                      {activo ? 'Seleccionado' : 'Ver experiencias'}
                      <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}

        <InsigniasConfianza />
      </section>

      {/* --- Paso B: experiencia (plan) --- */}
      {anio !== null && (
        <div ref={seccionPlanesRef} className="scroll-mt-24">
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
                      'overflow-hidden rounded-2xl border-2 text-left transition-colors',
                      activo
                        ? 'border-oro-400 shadow-lg shadow-oro-500/15'
                        : 'border-tinta-200 hover:border-marca-300',
                    )}
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
                      {activo && (
                        <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-linear-to-br from-oro-300 to-oro-600 text-noche-900 shadow">
                          <Check className="size-4" aria-hidden />
                        </span>
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
        </div>
      )}

      {/* --- Detalle del plan elegido: presentación grande + convenio pequeño al lado --- */}
      {planSeleccionado && (planSeleccionado.presentacionUrl || planSeleccionado.imagenUrl) && (
        <motion.div
          ref={detalleRef}
          className="scroll-mt-24"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Card>
            <CardHeader
              titulo={planSeleccionado.nombre}
              descripcion="Así se ve tu experiencia. Al lado, una vista del convenio que vas a firmar."
              icono={<Sparkles className="size-5" aria-hidden />}
              className="mb-4"
            />
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Imagen de presentación: grande */}
              <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-tinta-200 bg-tinta-50">
                <img
                  src={planSeleccionado.presentacionUrl ?? planSeleccionado.imagenUrl ?? ''}
                  alt={`Experiencia ${planSeleccionado.nombre}`}
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
      )}
    </div>
  );
}
