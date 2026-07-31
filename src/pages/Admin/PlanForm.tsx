import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Plus, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import {
  useActualizarPlan,
  useAgregarDocumentosPlan,
  useCrearPlan,
  useDocumentosPlan,
  useEliminarDocumentoPlan,
} from '@/hooks/usePlanes';
import type { PlanConImagen } from '@/types/planes.types';

interface Props {
  /** `null` = creando un plan nuevo. */
  plan: PlanConImagen | null;
  alGuardar: (plan: PlanConImagen) => void;
  alCancelar: () => void;
}

const ANIO_ACTUAL = new Date().getFullYear();

/** Quita todo lo que no sea dígito: "2.500.000" -> "2500000". */
function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

function conSeparadores(valor: string): string {
  const limpio = soloDigitos(valor);
  return limpio === '' ? '' : Number(limpio).toLocaleString('es-CO');
}

export function PlanForm({ plan, alGuardar, alCancelar }: Props) {
  const [nombre, setNombre] = useState('');
  const [anio, setAnio] = useState(String(ANIO_ACTUAL));
  const [valor, setValor] = useState('');
  const [numeroBoletas, setNumeroBoletas] = useState('1');
  const [personalizado, setPersonalizado] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const crear = useCrearPlan();
  const actualizar = useActualizarPlan();
  const guardando = crear.isPending || actualizar.isPending;

  useEffect(() => {
    setNombre(plan?.nombre ?? '');
    setAnio(String(plan?.anio ?? ANIO_ACTUAL));
    setValor(plan ? conSeparadores(String(Math.round(Number(plan.valor)))) : '');
    setNumeroBoletas(String(plan?.numero_boletas ?? 1));
    setPersonalizado(plan?.personalizado ?? false);
    setDescripcion(plan?.descripcion ?? '');
    setActivo(plan?.activo ?? true);
    setError(null);
  }, [plan]);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError(null);

    if (nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    const boletas = Number(numeroBoletas);
    if (!Number.isInteger(boletas) || boletas < 0 || boletas > 20) {
      setError('El número de boletas debe estar entre 0 y 20.');
      return;
    }

    const datos = {
      nombre: nombre.trim(),
      anio: Number(anio),
      valor: Number(soloDigitos(valor) || '0'),
      numeroBoletas: boletas,
      personalizado,
      descripcion: descripcion.trim(),
      activo,
    };

    try {
      const resultado = plan
        ? await actualizar.mutateAsync({ id: plan.id, datos })
        : await crear.mutateAsync(datos);

      alGuardar(resultado);
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-tinta-700">
          Nombre del plan
        </span>
        <input
          value={nombre}
          autoFocus
          placeholder="Convenio de Reserva Santa Marta Aéreo"
          onChange={(evento) => setNombre(evento.target.value)}
          className="w-full rounded-lg border border-tinta-300 px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-tinta-700">Año</span>
          <input
            type="number"
            min={2000}
            max={2200}
            value={anio}
            onChange={(evento) => setAnio(evento.target.value)}
            className="w-full rounded-lg border border-tinta-300 px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-tinta-700">Valor</span>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-tinta-400">
              $
            </span>
            <input
              inputMode="numeric"
              value={valor}
              placeholder="2.798.000"
              onChange={(evento) => setValor(conSeparadores(evento.target.value))}
              className="w-full rounded-lg border border-tinta-300 py-2 pr-3 pl-7 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
            />
          </div>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-tinta-700">
          Número de boletas
        </span>
        <input
          type="number"
          min={0}
          max={20}
          value={numeroBoletas}
          onChange={(evento) => setNumeroBoletas(evento.target.value)}
          className="w-full rounded-lg border border-tinta-300 px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
        />
        <span className="mt-1 block text-xs text-tinta-400">
          Cuántas boletas de sorteo emite este plan. Se generará una copia de la boleta por cada
          número asignado. Usa <strong>0</strong> si el plan no tiene sorteo (no asigna número ni
          boletas).
        </span>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-tinta-700">
          Descripción <span className="font-normal text-tinta-400">(opcional)</span>
        </span>
        <textarea
          rows={2}
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
          className="w-full resize-none rounded-lg border border-tinta-300 px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
        />
      </label>

      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={activo}
          onChange={(evento) => setActivo(evento.target.checked)}
          className="size-4 rounded border-tinta-300 text-marca-600 focus:ring-marca-500"
        />
        <span className="text-sm text-tinta-700">
          Disponible para nuevas reservas
        </span>
      </label>

      <label className="flex items-start gap-2.5 rounded-lg bg-tinta-50 p-3">
        <input
          type="checkbox"
          checked={personalizado}
          onChange={(evento) => setPersonalizado(evento.target.checked)}
          className="mt-0.5 size-4 rounded border-tinta-300 text-marca-600 focus:ring-marca-500"
        />
        <span className="text-sm text-tinta-700">
          <span className="font-medium">Plan personalizado (por enlace)</span>
          <span className="mt-0.5 block text-xs text-tinta-500">
            No aparece en el selector público. Al guardarlo se genera un enlace único que
            compartes con el colegio para que hagan su inscripción.
          </span>
        </span>
      </label>

      {plan && personalizado && <GestorDocumentosPlan planId={plan.id} />}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {!plan && (
        <p className="rounded-lg bg-marca-50 px-3 py-2.5 text-sm text-marca-800">
          Después de crear el plan podrás subir la imagen del convenio. Sin ella el
          plan no aparecerá como opción en el registro.
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variante="secundario" onClick={alCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button
          type="submit"
          cargando={guardando}
          iconoIzquierda={guardando ? <Loader2 className="size-4 animate-spin" /> : undefined}
        >
          {plan ? 'Guardar cambios' : 'Crear plan'}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------

/**
 * Documentos autorizados de un plan personalizado. Si la lista está vacía,
 * cualquiera con el enlace puede diligenciarlo; si tiene documentos, solo esos.
 */
function GestorDocumentosPlan({ planId }: { planId: string }) {
  const consulta = useDocumentosPlan(planId);
  const agregar = useAgregarDocumentosPlan(planId);
  const eliminar = useEliminarDocumentoPlan(planId);
  const toast = useToast();
  const [texto, setTexto] = useState('');

  const documentos = consulta.data ?? [];

  const onAgregar = async () => {
    // Admite varios pegados separados por coma, espacio o salto de línea.
    const nuevos = texto
      .split(/[\s,;]+/)
      .map((d) => d.trim())
      .filter(Boolean);
    if (nuevos.length === 0) return;

    try {
      await agregar.mutateAsync(nuevos);
      setTexto('');
    } catch (fallo) {
      toast.error(mensajeDeError(fallo));
    }
  };

  return (
    <div className="rounded-xl border border-marca-200 bg-marca-50/50 p-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-marca-600" aria-hidden />
        <span className="text-sm font-medium text-tinta-800">Documentos autorizados</span>
      </div>
      <p className="mt-0.5 text-xs text-tinta-500">
        Solo estos documentos podrán diligenciar el plan por su enlace. Si lo dejas vacío,
        cualquiera con el enlace podrá hacerlo.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          value={texto}
          placeholder="Documento(s), separados por coma o espacio"
          onChange={(evento) => setTexto(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') {
              evento.preventDefault();
              void onAgregar();
            }
          }}
          className="min-w-0 flex-1 rounded-lg border border-tinta-300 px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
        />
        <Button
          type="button"
          tamano="sm"
          cargando={agregar.isPending}
          onClick={() => void onAgregar()}
          iconoIzquierda={<Plus className="size-4" aria-hidden />}
        >
          Agregar
        </Button>
      </div>

      <div className="mt-3">
        {consulta.isPending ? (
          <Spinner />
        ) : documentos.length === 0 ? (
          <p className="text-xs text-tinta-400">Sin restricción: cualquiera puede diligenciarlo.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {documentos.map((doc) => (
              <li
                key={doc}
                className="inline-flex items-center gap-1 rounded-lg border border-tinta-200 bg-white py-1 pr-1 pl-2.5 text-sm text-tinta-700"
              >
                <span className="font-mono">{doc}</span>
                <button
                  type="button"
                  onClick={() => void eliminar.mutateAsync(doc).catch(() => undefined)}
                  aria-label={`Quitar ${doc}`}
                  className="rounded-md p-0.5 text-tinta-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
