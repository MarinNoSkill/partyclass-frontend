import { useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ImageOff,
  ImageUp,
  Layers,
  Link2,
  Pencil,
  Plus,
  Power,
  Ticket,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { PlanForm } from './PlanForm';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import {
  useActualizarPlan,
  useEliminarBoleta,
  useEliminarPlan,
  useEliminarPlantilla,
  useEliminarPresentacion,
  usePlanesAdmin,
  useSubirBoleta,
  useSubirPlantilla,
  useSubirPresentacion,
} from '@/hooks/usePlanes';
import { cn } from '@/utils/cn';
import type { PlanConImagen } from '@/types/planes.types';

const MAX_PLANTILLA_BYTES = 15 * 1024 * 1024;
const MIMES_PLANTILLA = ['image/jpeg', 'image/png'];

function formatearPesos(valor: string): string {
  return Number(valor).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

export function PlanesPage() {
  const [anioFiltro, setAnioFiltro] = useState<number | undefined>(undefined);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [planEditando, setPlanEditando] = useState<PlanConImagen | null>(null);
  const [planAEliminar, setPlanAEliminar] = useState<PlanConImagen | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<{ url: string; titulo: string } | null>(null);

  const consulta = usePlanesAdmin(anioFiltro !== undefined ? { anio: anioFiltro } : {});
  const eliminarPlan = useEliminarPlan();
  const reordenar = useActualizarPlan();
  const toast = useToast();

  const anios = [...new Set((consulta.data ?? []).map((plan) => plan.anio))].sort(
    (a, b) => b - a,
  );

  /**
   * Cambia el orden de un plan dentro de su año. Reasigna posiciones
   * secuenciales a todo el grupo (robusto aunque varios compartan `orden`).
   */
  const moverPlan = async (plan: PlanConImagen, direccion: 'subir' | 'bajar') => {
    const grupo = (consulta.data ?? []).filter((p) => p.anio === plan.anio);
    const idx = grupo.findIndex((p) => p.id === plan.id);
    const destino = direccion === 'subir' ? idx - 1 : idx + 1;
    if (destino < 0 || destino >= grupo.length) return;

    const nuevo = [...grupo];
    [nuevo[idx], nuevo[destino]] = [nuevo[destino], nuevo[idx]];

    try {
      await Promise.all(
        nuevo
          .map((p, i) => ({ p, i }))
          .filter(({ p, i }) => p.orden !== i)
          .map(({ p, i }) => reordenar.mutateAsync({ id: p.id, datos: { orden: i } })),
      );
    } catch (fallo) {
      toast.error(mensajeDeError(fallo));
    }
  };

  const abrirCreacion = () => {
    setPlanEditando(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (plan: PlanConImagen) => {
    setPlanEditando(plan);
    setModalAbierto(true);
  };

  const confirmarEliminacion = async () => {
    if (!planAEliminar) return;

    try {
      await eliminarPlan.mutateAsync(planAEliminar.id);
      toast.exito(`Plan "${planAEliminar.nombre}" eliminado.`);
      setPlanAEliminar(null);
    } catch (fallo) {
      toast.error(mensajeDeError(fallo));
    }
  };

  return (
    <div className="space-y-5">
      <Card sinRelleno>
        <CardHeader
          titulo="Planes"
          descripcion="Cada plan define el convenio que se rellenará con los datos del registro."
          icono={<Layers className="size-5" aria-hidden />}
          acciones={
            <Button onClick={abrirCreacion} iconoIzquierda={<Plus className="size-4" />}>
              Nuevo plan
            </Button>
          }
        />

        {anios.length > 1 && (
          <div className="flex flex-wrap gap-2 border-y border-tinta-200 bg-tinta-50/60 p-4">
            <button
              type="button"
              onClick={() => setAnioFiltro(undefined)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                anioFiltro === undefined
                  ? 'bg-marca-600 text-white'
                  : 'bg-white text-tinta-600 hover:bg-tinta-100'
              }`}
            >
              Todos los años
            </button>
            {anios.map((anio) => (
              <button
                key={anio}
                type="button"
                onClick={() => setAnioFiltro(anio)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  anioFiltro === anio
                    ? 'bg-marca-600 text-white'
                    : 'bg-white text-tinta-600 hover:bg-tinta-100'
                }`}
              >
                {anio}
              </button>
            ))}
          </div>
        )}

        {consulta.isPending ? (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        ) : consulta.isError ? (
          <div className="p-6">
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {mensajeDeError(consulta.error)}
            </p>
          </div>
        ) : consulta.data.length === 0 ? (
          <EmptyState
            icono={<Layers className="size-6" aria-hidden />}
            titulo="Todavía no hay planes"
            descripcion="Crea el primer plan y sube la imagen de su convenio para que aparezca en el registro."
            accion={
              <Button onClick={abrirCreacion} iconoIzquierda={<Plus className="size-4" />}>
                Crear plan
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-tinta-100">
            {consulta.data.map((plan) => {
              const grupo = consulta.data.filter((p) => p.anio === plan.anio);
              const idx = grupo.findIndex((p) => p.id === plan.id);
              return (
                <FilaPlan
                  key={plan.id}
                  plan={plan}
                  esPrimero={idx === 0}
                  esUltimo={idx === grupo.length - 1}
                  moviendo={reordenar.isPending}
                  alSubir={() => void moverPlan(plan, 'subir')}
                  alBajar={() => void moverPlan(plan, 'bajar')}
                  alEditar={() => abrirEdicion(plan)}
                  alEliminar={() => setPlanAEliminar(plan)}
                  alVerImagen={(url, titulo) => setVistaPrevia({ url, titulo })}
                />
              );
            })}
          </ul>
        )}
      </Card>

      {/* --- Crear / editar --- */}
      <Modal
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        titulo={planEditando ? 'Editar plan' : 'Nuevo plan'}
        descripcion={
          planEditando
            ? 'Puedes cambiar el nombre, el año, el valor y la imagen del convenio.'
            : 'Define el plan. La imagen del convenio se sube después.'
        }
      >
        <PlanForm
          plan={planEditando}
          alCancelar={() => setModalAbierto(false)}
          alGuardar={(guardado) => {
            setModalAbierto(false);
            toast.exito(
              planEditando ? 'Plan actualizado.' : `Plan "${guardado.nombre}" creado.`,
            );
          }}
        />
      </Modal>

      {/* --- Confirmar borrado --- */}
      <Modal
        abierto={planAEliminar !== null}
        alCerrar={() => setPlanAEliminar(null)}
        titulo="Eliminar plan"
        tamano="sm"
      >
        <p className="text-sm text-tinta-600">
          ¿Seguro que quieres eliminar{' '}
          <strong className="text-tinta-900">{planAEliminar?.nombre}</strong>? Se borrará
          también su imagen de convenio. Esta acción no se puede deshacer.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setPlanAEliminar(null)}>
            Cancelar
          </Button>
          <Button
            variante="peligro"
            cargando={eliminarPlan.isPending}
            onClick={confirmarEliminacion}
          >
            Eliminar
          </Button>
        </div>
      </Modal>

      {/* --- Vista previa de una imagen (convenio o boleta) --- */}
      <Modal
        abierto={vistaPrevia !== null}
        alCerrar={() => setVistaPrevia(null)}
        titulo={vistaPrevia?.titulo ?? ''}
        tamano="xl"
      >
        {vistaPrevia && (
          <img
            src={vistaPrevia.url}
            alt={vistaPrevia.titulo}
            className="w-full rounded-lg border border-tinta-200"
          />
        )}
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------

/** Enlace de inscripción de un plan personalizado, con botón para copiar. */
function EnlaceInscripcion({ token }: { token: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = `${window.location.origin}/inscripcion/${token}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin portapapeles (contexto no seguro): el usuario copia a mano.
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-marca-200 bg-marca-50 px-3 py-1.5">
      <Link2 className="size-3.5 shrink-0 text-marca-600" aria-hidden />
      <span className="truncate font-mono text-xs text-marca-800">{url}</span>
      <button
        type="button"
        onClick={() => void copiar()}
        className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-marca-700 transition-colors hover:bg-marca-100"
      >
        {copiado ? (
          <>
            <Check className="size-3.5" aria-hidden />
            Copiado
          </>
        ) : (
          <>
            <Copy className="size-3.5" aria-hidden />
            Copiar
          </>
        )}
      </button>
    </div>
  );
}

/**
 * Miniatura + subir/quitar de UNA imagen del plan (convenio o boleta).
 * Se instancia dos veces por plan y encapsula la validación de archivo.
 */
interface PropsImagen {
  etiqueta: string;
  url: string | null;
  presente: boolean;
  subiendo: boolean;
  quitando: boolean;
  alSubir: (archivo: File) => Promise<void>;
  alQuitar: () => void;
  alVer: () => void;
}

function ControlImagenPlan({
  etiqueta,
  url,
  presente,
  subiendo,
  quitando,
  alSubir,
  alQuitar,
  alVer,
}: PropsImagen) {
  const entrada = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const seleccionar = async (archivo: File | undefined) => {
    if (!archivo) return;

    // Validación en cliente para feedback inmediato; el backend la repite.
    if (!MIMES_PLANTILLA.includes(archivo.type)) {
      toast.error(`La imagen de ${etiqueta.toLowerCase()} debe ser JPG o PNG.`);
      return;
    }
    if (archivo.size > MAX_PLANTILLA_BYTES) {
      toast.error('La imagen supera el tamaño máximo de 15 MB.');
      return;
    }

    try {
      await alSubir(archivo);
    } finally {
      if (entrada.current) entrada.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={url ? alVer : () => entrada.current?.click()}
        className="grid h-24 w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-tinta-200 bg-tinta-50 transition-colors hover:border-marca-400"
      >
        {url ? (
          <img src={url} alt={etiqueta} className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-tinta-400">
            <ImageOff className="size-5" aria-hidden />
            <span className="text-[11px]">Sin {etiqueta.toLowerCase()}</span>
          </span>
        )}
      </button>

      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(evento) => void seleccionar(evento.target.files?.[0])}
      />

      <div className="flex items-center gap-1">
        <Button
          variante="fantasma"
          tamano="sm"
          cargando={subiendo}
          onClick={() => entrada.current?.click()}
          iconoIzquierda={<ImageUp className="size-3.5" aria-hidden />}
        >
          {presente ? 'Cambiar' : etiqueta}
        </Button>
        {presente && (
          <Button
            variante="fantasma"
            tamano="sm"
            cargando={quitando}
            onClick={alQuitar}
            aria-label={`Quitar ${etiqueta.toLowerCase()}`}
          >
            <ImageOff className="size-3.5" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}

interface PropsFila {
  plan: PlanConImagen;
  esPrimero: boolean;
  esUltimo: boolean;
  moviendo: boolean;
  alSubir: () => void;
  alBajar: () => void;
  alEditar: () => void;
  alEliminar: () => void;
  alVerImagen: (url: string, titulo: string) => void;
}

function FilaPlan({
  plan,
  esPrimero,
  esUltimo,
  moviendo,
  alSubir,
  alBajar,
  alEditar,
  alEliminar,
  alVerImagen,
}: PropsFila) {
  const subirConvenio = useSubirPlantilla();
  const quitarConvenio = useEliminarPlantilla();
  const subirBoleta = useSubirBoleta();
  const quitarBoleta = useEliminarBoleta();
  const subirPresentacion = useSubirPresentacion();
  const quitarPresentacion = useEliminarPresentacion();
  const actualizar = useActualizarPlan();
  const toast = useToast();

  const conMensaje = async (accion: Promise<unknown>, ok: string) => {
    try {
      await accion;
      toast.exito(ok);
    } catch (fallo) {
      toast.error(mensajeDeError(fallo));
    }
  };

  /** Bloquea o reactiva el plan sin abrir el formulario. Un plan inactivo no se ofrece al estudiante. */
  const alternarActivo = () =>
    conMensaje(
      actualizar.mutateAsync({ id: plan.id, datos: { activo: !plan.activo } }),
      plan.activo ? `Plan "${plan.nombre}" bloqueado.` : `Plan "${plan.nombre}" reactivado.`,
    );

  return (
    <li className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
      <div className="flex gap-3">
        <ControlImagenPlan
          etiqueta="Convenio"
          url={plan.imagenUrl}
          presente={Boolean(plan.imagen_ruta)}
          subiendo={subirConvenio.isPending}
          quitando={quitarConvenio.isPending}
          alSubir={(archivo) =>
            conMensaje(subirConvenio.mutateAsync({ id: plan.id, archivo }), 'Convenio actualizado.')
          }
          alQuitar={() => void quitarConvenio.mutateAsync(plan.id).catch(() => undefined)}
          alVer={() => plan.imagenUrl && alVerImagen(plan.imagenUrl, `Convenio · ${plan.nombre}`)}
        />
        <ControlImagenPlan
          etiqueta="Boleta"
          url={plan.boletaUrl}
          presente={Boolean(plan.boleta_ruta)}
          subiendo={subirBoleta.isPending}
          quitando={quitarBoleta.isPending}
          alSubir={(archivo) =>
            conMensaje(subirBoleta.mutateAsync({ id: plan.id, archivo }), 'Boleta actualizada.')
          }
          alQuitar={() => void quitarBoleta.mutateAsync(plan.id).catch(() => undefined)}
          alVer={() => plan.boletaUrl && alVerImagen(plan.boletaUrl, `Boleta · ${plan.nombre}`)}
        />
        <ControlImagenPlan
          etiqueta="Presentación"
          url={plan.presentacionUrl}
          presente={Boolean(plan.presentacion_ruta)}
          subiendo={subirPresentacion.isPending}
          quitando={quitarPresentacion.isPending}
          alSubir={(archivo) =>
            conMensaje(
              subirPresentacion.mutateAsync({ id: plan.id, archivo }),
              'Imagen de presentación actualizada.',
            )
          }
          alQuitar={() => void quitarPresentacion.mutateAsync(plan.id).catch(() => undefined)}
          alVer={() =>
            plan.presentacionUrl &&
            alVerImagen(plan.presentacionUrl, `Presentación · ${plan.nombre}`)
          }
        />
      </div>

      {/* Datos */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium text-tinta-900">{plan.nombre}</h3>
          <Badge tono={plan.activo ? 'exito' : 'neutro'}>
            {plan.activo ? 'Activo' : 'Inactivo'}
          </Badge>
          {!plan.imagen_ruta && (
            <Badge tono="alerta">
              <AlertTriangle className="mr-1 inline size-3" aria-hidden />
              Falta el convenio
            </Badge>
          )}
          {!plan.boleta_ruta && (
            <Badge tono="alerta">
              <AlertTriangle className="mr-1 inline size-3" aria-hidden />
              Falta la boleta
            </Badge>
          )}
          {plan.personalizado && (
            <Badge tono="marca">
              <Link2 className="mr-1 inline size-3" aria-hidden />
              Personalizado
            </Badge>
          )}
        </div>

        {plan.personalizado && plan.token && (
          <EnlaceInscripcion token={plan.token} />
        )}

        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta-500">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden />
            {plan.anio}
          </span>
          <span className="font-medium text-tinta-700">{formatearPesos(plan.valor)}</span>
          <span className="inline-flex items-center gap-1">
            <Ticket className="size-3.5" aria-hidden />
            {plan.numero_boletas} boleta{plan.numero_boletas === 1 ? '' : 's'}
          </span>
          <span className="font-mono text-xs text-tinta-400">{plan.codigo}</span>
        </p>

        {plan.total_convenios > 0 && (
          <p className="mt-1 text-xs text-tinta-400">
            {plan.total_convenios} convenio(s) emitido(s) · no se puede eliminar
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex flex-col">
          <button
            type="button"
            disabled={esPrimero || moviendo}
            onClick={alSubir}
            aria-label="Subir plan en el orden"
            className="rounded-md p-0.5 text-tinta-400 transition-colors hover:bg-tinta-100 hover:text-tinta-700 disabled:opacity-30"
          >
            <ChevronUp className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            disabled={esUltimo || moviendo}
            onClick={alBajar}
            aria-label="Bajar plan en el orden"
            className="rounded-md p-0.5 text-tinta-400 transition-colors hover:bg-tinta-100 hover:text-tinta-700 disabled:opacity-30"
          >
            <ChevronDown className="size-4" aria-hidden />
          </button>
        </div>

        <Button
          variante="fantasma"
          tamano="sm"
          cargando={actualizar.isPending}
          onClick={alternarActivo}
          aria-label={plan.activo ? 'Bloquear plan' : 'Reactivar plan'}
          title={
            plan.activo
              ? 'Bloquear: dejará de mostrarse al estudiante'
              : 'Reactivar: volverá a estar disponible'
          }
        >
          <Power
            className={cn('size-4', plan.activo ? 'text-emerald-600' : 'text-tinta-400')}
            aria-hidden
          />
        </Button>

        <Button variante="fantasma" tamano="sm" onClick={alEditar} aria-label="Editar plan">
          <Pencil className="size-4" aria-hidden />
        </Button>

        <Button
          variante="fantasma"
          tamano="sm"
          disabled={!plan.eliminable}
          onClick={alEliminar}
          aria-label="Eliminar plan"
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
    </li>
  );
}
