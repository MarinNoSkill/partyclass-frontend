import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  FileSignature,
  ImageUp,
  Plus,
  ShieldCheck,
  Table2,
  Trash2,
  UserRoundCog,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeEstado } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { useListaReservas } from '@/hooks/useReservas';
import { formatearFechaHora } from '@/utils/formato';
import {
  useAgregarAutorizados,
  useAutorizadosRepresentante,
  useEliminarAutorizado,
  usePlanRepresentante,
  useSubirConvenioRepresentante,
} from '@/hooks/useRepresentantes';

const MAX_BYTES = 15 * 1024 * 1024;
const MIMES = ['image/jpeg', 'image/png'];

/**
 * Administración del módulo de representantes: la imagen del convenio y la
 * lista de documentos autorizados a usar /representante.
 */
export function RepresentantesPage() {
  const plan = usePlanRepresentante();
  const autorizados = useAutorizadosRepresentante();
  const agregar = useAgregarAutorizados();
  const eliminar = useEliminarAutorizado();
  const subirConvenio = useSubirConvenioRepresentante();
  const toast = useToast();

  const registros = useListaReservas({ esRepresentante: 'true', tamano: 100 });

  const entradaImg = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState('');

  const onAgregar = async () => {
    const documentos = texto
      .split(/[\s,;]+/)
      .map((d) => d.trim())
      .filter(Boolean);
    if (documentos.length === 0) {
      toast.error('Escribe al menos un documento.');
      return;
    }
    try {
      await agregar.mutateAsync(documentos);
      toast.exito(`${documentos.length} documento(s) autorizado(s).`);
      setTexto('');
    } catch (fallo) {
      toast.error(mensajeDeError(fallo));
    }
  };

  const subirImagen = async (archivo: File | undefined) => {
    if (!archivo || !plan.data) return;
    if (!MIMES.includes(archivo.type)) {
      toast.error('La imagen debe ser JPG o PNG.');
      return;
    }
    if (archivo.size > MAX_BYTES) {
      toast.error('La imagen supera los 15 MB.');
      return;
    }
    try {
      await subirConvenio.mutateAsync({ id: plan.data.id, archivo });
      toast.exito('Convenio de representante actualizado.');
    } catch (fallo) {
      toast.error(mensajeDeError(fallo));
    } finally {
      if (entradaImg.current) entradaImg.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      {/* Convenio de representante */}
      <Card sinRelleno>
        <CardHeader
          titulo="Convenio de representante"
          descripcion="La plantilla que se rellena al registrar un representante. Sin ella, no se puede registrar."
          icono={<FileSignature className="size-5" aria-hidden />}
        />
        <div className="flex flex-col items-start gap-4 border-t border-tinta-200 p-4 sm:flex-row sm:items-center">
          {plan.isPending ? (
            <Spinner />
          ) : plan.isError ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {mensajeDeError(plan.error)} (¿ejecutaste la migración 15?)
            </p>
          ) : (
            <>
              <div className="grid h-28 w-40 shrink-0 place-items-center overflow-hidden rounded-xl border border-tinta-200 bg-tinta-50">
                {plan.data?.imagenUrl ? (
                  <img
                    src={plan.data.imagenUrl}
                    alt="Convenio de representante"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-tinta-400">Sin convenio</span>
                )}
              </div>
              <div>
                <input
                  ref={entradaImg}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(evento) => void subirImagen(evento.target.files?.[0])}
                />
                <Button
                  cargando={subirConvenio.isPending}
                  onClick={() => entradaImg.current?.click()}
                  iconoIzquierda={<ImageUp className="size-4" aria-hidden />}
                >
                  {plan.data?.imagenUrl ? 'Cambiar convenio' : 'Subir convenio'}
                </Button>
                <p className="mt-1.5 text-xs text-tinta-400">JPG o PNG, hasta 15 MB.</p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Autorizados */}
      <Card sinRelleno>
        <CardHeader
          titulo="Representantes autorizados"
          descripcion="Solo estos documentos pueden entrar a /representante y registrarse."
          icono={<UserRoundCog className="size-5" aria-hidden />}
          acciones={
            <Badge tono={(autorizados.data ?? []).length > 0 ? 'marca' : 'neutro'}>
              {(autorizados.data ?? []).length} autorizado(s)
            </Badge>
          }
        />

        <div className="space-y-3 border-t border-tinta-200 p-4">
          <div className="flex gap-2">
            <input
              value={texto}
              placeholder="Documento(s) separados por coma o espacio"
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
              cargando={agregar.isPending}
              onClick={() => void onAgregar()}
              iconoIzquierda={<Plus className="size-4" aria-hidden />}
            >
              Autorizar
            </Button>
          </div>

          {autorizados.isPending ? (
            <div className="grid place-items-center py-8">
              <Spinner />
            </div>
          ) : (autorizados.data ?? []).length === 0 ? (
            <EmptyState
              icono={<ShieldCheck className="size-6" aria-hidden />}
              titulo="Sin representantes autorizados"
              descripcion="Autoriza documentos para que puedan usar el enlace /representante."
            />
          ) : (
            <ul className="divide-y divide-tinta-100">
              {(autorizados.data ?? []).map((doc, indice) => (
                <li key={doc.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-tinta-100 text-xs font-semibold text-tinta-500 tabular-nums">
                    {indice + 1}
                  </span>
                  <span className="min-w-0 flex-1 font-mono text-sm font-semibold text-tinta-900">
                    {doc.numero_documento}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      void eliminar.mutateAsync(doc.numero_documento).catch(() => undefined)
                    }
                    aria-label={`Quitar ${doc.numero_documento}`}
                    className="rounded-md p-1.5 text-tinta-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Representantes registrados */}
      <Card sinRelleno>
        <CardHeader
          titulo="Representantes registrados"
          descripcion="Registros hechos desde el enlace /representante. No aparecen en Registros."
          icono={<Table2 className="size-5" aria-hidden />}
          acciones={
            <Badge tono="marca">{registros.data?.items.length ?? 0}</Badge>
          }
        />

        <div className="border-t border-tinta-200">
          {registros.isPending ? (
            <div className="grid place-items-center py-10">
              <Spinner />
            </div>
          ) : registros.isError ? (
            <p className="m-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {mensajeDeError(registros.error)}
            </p>
          ) : (registros.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icono={<UserRoundCog className="size-6" aria-hidden />}
              titulo="Sin representantes registrados"
              descripcion="Cuando un representante diligencie el formulario, aparecerá aquí."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-tinta-200 bg-tinta-50 text-xs tracking-wide text-tinta-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Código</th>
                    <th className="px-4 py-3 font-medium">Representante</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-tinta-100">
                  {registros.data?.items.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-tinta-50/70">
                      <td className="px-4 py-3 font-medium text-tinta-900">{r.codigo}</td>
                      <td className="px-4 py-3">
                        <p className="text-tinta-900">{r.estudiante_nombre ?? '—'}</p>
                        <p className="text-xs text-tinta-500">{r.estudiante_documento ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <BadgeEstado estado={r.estado} />
                      </td>
                      <td className="px-4 py-3 text-tinta-600">
                        {formatearFechaHora(r.updated_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/registros/${r.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-marca-600 transition-colors hover:bg-marca-50"
                        >
                          <Eye className="size-4" aria-hidden />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
