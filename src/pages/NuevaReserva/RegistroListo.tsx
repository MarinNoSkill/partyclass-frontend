import { useEffect, useState } from 'react';
import { CheckCircle2, Download, FileText, Plus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { contratoService } from '@/services/contrato.service';
import type { RegistroCreado } from '@/services/registro.service';

interface Props {
  resultado: RegistroCreado;
  alNuevoRegistro: () => void;
}

/**
 * Pantalla final: número asignado y descarga del convenio.
 *
 * Vive en el orquestador, no dentro del paso 4. Al crear el registro se limpia
 * el estado del wizard, y eso hace que el padre deje de renderizar los pasos:
 * si esta pantalla estuviera dentro del paso, se desmontaría antes de llegar a
 * verse y el operador volvería a la selección de plan sin saber qué número le
 * tocó.
 */
export function RegistroListo({ resultado, alNuevoRegistro }: Props) {
  const [urlConvenio, setUrlConvenio] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const { error: mostrarError } = useToast();

  /**
   * Se descarga una sola vez y se reutiliza el mismo blob para verlo y para
   * guardarlo: es el documento definitivo, no hace falta pedirlo dos veces.
   */
  useEffect(() => {
    let cancelado = false;
    let creada: string | null = null;

    contratoService
      .descargarBlob(resultado.id)
      .then((blob) => {
        if (cancelado) return;
        creada = URL.createObjectURL(blob);
        setUrlConvenio(creada);
      })
      .catch((fallo: unknown) => {
        if (!cancelado) mostrarError('No se pudo cargar el convenio', mensajeDeError(fallo));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
      if (creada) URL.revokeObjectURL(creada);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado.id]);

  return (
    <div className="space-y-5">
    <Card className="mx-auto max-w-xl text-center">
      <span
        className={`mx-auto grid size-14 place-items-center rounded-2xl ${
          resultado.pendiente
            ? 'bg-amber-50 text-amber-600'
            : 'bg-emerald-50 text-emerald-600'
        }`}
      >
        <CheckCircle2 className="size-7" aria-hidden />
      </span>

      <h2 className="mt-4 text-lg font-semibold text-tinta-900">
        {resultado.pendiente ? 'Registro creado · pendiente de firmas' : 'Registro completado'}
      </h2>
      <p className="mt-1 text-sm text-tinta-500">
        El convenio se generó y quedó archivado con
        {resultado.numerosConvenio.length === 1
          ? ' el número que le correspondió.'
          : ` sus ${resultado.numerosConvenio.length} boletas.`}
      </p>

      {resultado.pendiente && (
        <div className="mx-auto mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
          Faltan firmas: el convenio tiene la marca <strong>PENDIENTE</strong>. Cuando cada
          acudiente firme desde el enlace de su correo, el registro se completa y el convenio se
          regenera sin la marca.
        </div>
      )}

      <div className="mx-auto mt-5 w-fit rounded-2xl border-2 border-marca-200 bg-marca-50 px-8 py-4">
        <p className="text-[11px] font-medium tracking-wide text-marca-700 uppercase">
          {resultado.numerosConvenio.length === 1 ? 'N.° de sorteo' : 'N.° de sorteo · boletas'}
        </p>
        <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-3xl font-semibold text-marca-700">
          {resultado.numerosConvenio.map((numero) => (
            <span key={numero}>{numero}</span>
          ))}
        </p>
      </div>

      <p className="mt-3 text-xs text-tinta-400">Registro {resultado.codigo}</p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {urlConvenio && (
          <a
            href={urlConvenio}
            download={`convenio-${resultado.codigo}.pdf`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-marca-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-marca-700"
          >
            <Download className="size-4" aria-hidden />
            Descargar convenio
          </a>
        )}

        <Button
          variante="secundario"
          onClick={alNuevoRegistro}
          iconoIzquierda={<Plus className="size-4" aria-hidden />}
        >
          Nuevo registro
        </Button>
      </div>
    </Card>

    {/* El convenio tal como quedó archivado */}
    <Card>
      <CardHeader
        titulo="Convenio y boletas"
        descripcion="Documento definitivo: el convenio y una boleta por cada número de sorteo."
        icono={<FileText className="size-5" aria-hidden />}
        className="mb-4"
      />

      {cargando ? (
        <div className="grid h-[60vh] place-items-center rounded-xl border border-tinta-200 bg-tinta-50">
          <div className="text-center">
            <Spinner className="mx-auto size-7" />
            <p className="mt-3 text-sm text-tinta-500">Cargando el convenio…</p>
          </div>
        </div>
      ) : urlConvenio ? (
        <iframe
          src={urlConvenio}
          title={`Convenio ${resultado.codigo}`}
          className="h-[60vh] w-full rounded-xl border border-tinta-200 bg-tinta-100"
        />
      ) : (
        <p className="rounded-xl border border-dashed border-tinta-300 bg-tinta-50 px-4 py-8 text-center text-sm text-tinta-500">
          No se pudo cargar la vista del convenio. El registro sí quedó guardado: puedes
          consultarlo desde el panel de administración.
        </p>
      )}
    </Card>
    </div>
  );
}
