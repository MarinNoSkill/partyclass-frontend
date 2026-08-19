import { useEffect, useRef, useState } from 'react';
import { ChevronRight, FileText, ImageUp, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/forms/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { usePlanesAdmin } from '@/hooks/usePlanes';
import { autorizacionesService, type PlanConfig } from '@/services/autorizaciones.service';

/**
 * Configuración de contratos por plan (dentro de Registros): para cada plan
 * activo, la plantilla del documento de autorización y qué contratos debe subir
 * el estudiante (p. ej. firmado, o firmado + notariado).
 */
export function ConfiguracionContratos() {
  const planes = usePlanesAdmin();
  const [planId, setPlanId] = useState<string | null>(null);

  const activos = (planes.data ?? []).filter((p) => p.activo);

  if (planes.isPending) return <Spinner className="mx-auto size-7" />;

  if (activos.length === 0) {
    return (
      <Card>
        <EmptyState
          icono={<FileText className="size-6" aria-hidden />}
          titulo="No hay planes activos"
          descripcion="Activa un plan para poder configurar su documento de autorización."
        />
      </Card>
    );
  }

  const plan = activos.find((p) => p.id === planId);

  return (
    <div className="space-y-4">
      {!plan ? (
        <Card sinRelleno>
          <CardHeader
            titulo="Configuración de contratos"
            descripcion="Elige un plan activo para configurar su documento y los contratos que sube el estudiante."
            icono={<FileText className="size-5" aria-hidden />}
          />
          <ul className="divide-y divide-tinta-100">
            {activos.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setPlanId(p.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-tinta-50"
                >
                  <div>
                    <p className="text-sm font-medium text-tinta-900">{p.nombre}</p>
                    <p className="text-xs text-tinta-500">{p.anio}</p>
                  </div>
                  <ChevronRight className="size-4 text-tinta-400" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <ConfigPlan
          planId={plan.id}
          nombre={plan.nombre}
          alVolver={() => setPlanId(null)}
        />
      )}
    </div>
  );
}

function ConfigPlan({
  planId,
  nombre,
  alVolver,
}: {
  planId: string;
  nombre: string;
  alVolver: () => void;
}) {
  const { exito, error: errorToast } = useToast();
  const [config, setConfig] = useState<PlanConfig | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [nuevoContrato, setNuevoContrato] = useState('');
  const plantilla = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCargando(true);
    autorizacionesService
      .obtenerConfig(planId)
      .then(setConfig)
      .catch((f) => errorToast('No se pudo cargar', mensajeDeError(f)))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const subirPlantilla = async (archivo: File) => {
    setOcupado(true);
    try {
      setConfig(await autorizacionesService.subirPlantilla(planId, archivo));
      exito('Plantilla del documento cargada');
    } catch (f) {
      errorToast('No se pudo subir la plantilla', mensajeDeError(f));
    } finally {
      setOcupado(false);
    }
  };

  const quitarPlantilla = async () => {
    if (!window.confirm('¿Borrar la plantilla del documento de este plan? El estudiante dejará de ver el documento hasta que cargues otra.')) {
      return;
    }
    setOcupado(true);
    try {
      setConfig(await autorizacionesService.eliminarPlantilla(planId));
      exito('Plantilla eliminada');
    } catch (f) {
      errorToast('No se pudo eliminar la plantilla', mensajeDeError(f));
    } finally {
      setOcupado(false);
    }
  };

  const agregar = async () => {
    if (nuevoContrato.trim().length < 2) return;
    setOcupado(true);
    try {
      const contratos = await autorizacionesService.agregarContrato(planId, nuevoContrato.trim());
      setConfig((c) => (c ? { ...c, contratos } : c));
      setNuevoContrato('');
    } catch (f) {
      errorToast('No se pudo agregar', mensajeDeError(f));
    } finally {
      setOcupado(false);
    }
  };

  const eliminar = async (id: string) => {
    setOcupado(true);
    try {
      await autorizacionesService.eliminarContrato(id);
      setConfig((c) => (c ? { ...c, contratos: c.contratos.filter((x) => x.id !== id) } : c));
    } catch (f) {
      errorToast('No se pudo eliminar', mensajeDeError(f));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={alVolver}
        className="text-sm font-medium text-marca-600 hover:underline"
      >
        ← Volver a los planes
      </button>

      {/* Plantilla del documento */}
      <Card sinRelleno>
        <CardHeader
          titulo={`Documento de autorización — ${nombre}`}
          descripcion="Imagen del documento que verá el estudiante (con sus datos en el encabezado, como el convenio)."
          icono={<FileText className="size-5" aria-hidden />}
        />
        <div className="flex flex-wrap items-center gap-3 border-t border-tinta-200 p-4">
          {cargando ? (
            <Spinner className="size-6" />
          ) : (
            <>
              <Button
                onClick={() => plantilla.current?.click()}
                disabled={ocupado}
                iconoIzquierda={<ImageUp className="size-4" aria-hidden />}
              >
                {config?.tienePlantilla ? 'Cambiar plantilla' : 'Subir plantilla'}
              </Button>
              {config?.urlPlantilla && (
                <a
                  href={config.urlPlantilla}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-marca-600 hover:underline"
                >
                  Ver plantilla actual
                </a>
              )}
              {config?.tienePlantilla && (
                <Button
                  variante="contorno"
                  onClick={() => void quitarPlantilla()}
                  disabled={ocupado}
                  iconoIzquierda={<Trash2 className="size-4" aria-hidden />}
                  className="text-red-600 hover:bg-red-50"
                >
                  Quitar plantilla
                </Button>
              )}
              {!config?.tienePlantilla && (
                <span className="text-sm text-amber-600">Aún sin plantilla.</span>
              )}
            </>
          )}
          <input
            ref={plantilla}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void subirPlantilla(f);
            }}
          />
        </div>
      </Card>

      {/* Contratos que el estudiante debe subir */}
      <Card sinRelleno>
        <CardHeader
          titulo="Contratos que sube el estudiante"
          descripcion="Además de los 4 documentos fijos (identidad estudiante, padre, madre y registro civil), define aquí los contratos de este plan."
          icono={<FileText className="size-5" aria-hidden />}
        />
        <div className="space-y-3 border-t border-tinta-200 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Input
              etiqueta="Nombre del contrato"
              placeholder="Ej: Contrato firmado y notariado"
              value={nuevoContrato}
              onChange={(e) => setNuevoContrato(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => void agregar()}
              disabled={ocupado || nuevoContrato.trim().length < 2}
              iconoIzquierda={<Plus className="size-4" aria-hidden />}
            >
              Agregar
            </Button>
          </div>

          {config && config.contratos.length === 0 ? (
            <p className="text-sm text-tinta-400">
              Sin contratos configurados. El estudiante solo subirá los 4 documentos fijos.
            </p>
          ) : (
            <ul className="space-y-2">
              {config?.contratos.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-tinta-200 px-3 py-2"
                >
                  <span className="text-sm text-tinta-800">{c.etiqueta}</span>
                  <button
                    type="button"
                    onClick={() => void eliminar(c.id)}
                    disabled={ocupado}
                    aria-label={`Quitar ${c.etiqueta}`}
                    className="text-tinta-400 hover:text-red-500"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
