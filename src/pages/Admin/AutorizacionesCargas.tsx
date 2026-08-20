import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Inbox,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { formatearFechaHora } from '@/utils/formato';
import {
  autorizacionesService,
  type AlumnoAutorizacion,
  type DetalleEstudiante,
  type EstudianteConCargas,
} from '@/services/autorizaciones.service';

/**
 * Panel admin (dentro de Registros): lista los estudiantes que subieron
 * documentos y, al abrir uno, muestra su ficha, qué documentos cargó, cuáles
 * faltan y las fotos subidas.
 */
export function AutorizacionesCargas() {
  const { error: errorToast } = useToast();
  const [lista, setLista] = useState<EstudianteConCargas[] | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState<EstudianteConCargas | null>(null);

  useEffect(() => {
    autorizacionesService
      .listarEstudiantesConCargas()
      .then(setLista)
      .catch((f) => {
        errorToast('No se pudo cargar', mensajeDeError(f));
        setLista([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q || !lista) return lista ?? [];
    return lista.filter(
      (e) => e.nombre.toLowerCase().includes(q) || e.numero_documento.toLowerCase().includes(q),
    );
  }, [lista, busqueda]);

  if (abierto) {
    return (
      <DetalleAlumno
        documento={abierto.numero_documento}
        nombre={abierto.nombre}
        alVolver={() => setAbierto(null)}
      />
    );
  }

  if (!lista) return <Spinner className="mx-auto size-7" />;

  return (
    <Card sinRelleno>
      <CardHeader
        titulo="Autorizaciones"
        descripcion="Estudiantes que subieron sus documentos. Abre uno para ver su ficha y sus cargas."
        icono={<ShieldCheck className="size-5" aria-hidden />}
      />

      <div className="border-y border-tinta-200 bg-tinta-50/60 p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-tinta-400"
            aria-hidden
          />
          <input
            value={busqueda}
            placeholder="Nombre o documento del estudiante…"
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-lg border border-tinta-300 bg-white py-2 pr-3 pl-10 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
          />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icono={<Inbox className="size-6" aria-hidden />}
          titulo="Sin cargas"
          descripcion="Ningún estudiante ha subido documentos todavía."
        />
      ) : (
        <ul className="divide-y divide-tinta-100">
          {filtrados.map((e) => (
            <li key={e.numero_documento}>
              <button
                type="button"
                onClick={() => setAbierto(e)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-tinta-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-tinta-900">{e.nombre}</p>
                  <p className="text-xs text-tinta-500">
                    {e.numero_documento} · {e.total} {e.total === 1 ? 'documento' : 'documentos'} ·
                    última carga {formatearFechaHora(e.ultima)}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-tinta-400" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DetalleAlumno({
  documento,
  nombre,
  alVolver,
}: {
  documento: string;
  nombre: string;
  alVolver: () => void;
}) {
  const { error: errorToast } = useToast();
  const [detalle, setDetalle] = useState<DetalleEstudiante | null>(null);

  useEffect(() => {
    autorizacionesService
      .detalleEstudiante(documento)
      .then(setDetalle)
      .catch((f) => errorToast('No se pudo cargar', mensajeDeError(f)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documento]);

  const cargados = detalle?.requisitos.filter((r) => r.subido) ?? [];
  const faltantes = detalle?.requisitos.filter((r) => !r.subido) ?? [];

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={alVolver}
        className="text-sm font-medium text-marca-600 hover:underline"
      >
        ← Volver a la lista
      </button>

      {!detalle ? (
        <Spinner className="mx-auto size-7" />
      ) : (
        <>
          {/* Ficha del estudiante */}
          <Card sinRelleno>
            <CardHeader
              titulo={nombre}
              descripcion={`Documento ${detalle.alumno.tipo_documento ?? ''} ${documento}`}
              icono={<ShieldCheck className="size-5" aria-hidden />}
              acciones={
                <span
                  className={
                    'rounded-full px-2.5 py-1 text-xs font-semibold ' +
                    (faltantes.length === 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700')
                  }
                >
                  {cargados.length}/{detalle.requisitos.length} cargados
                </span>
              }
            />
            <dl className="grid gap-x-8 border-t border-tinta-200 p-4 sm:grid-cols-2">
              <Fila etiqueta="Nombre" valor={nombreCompleto(detalle.alumno)} />
              <Fila etiqueta="Fecha de nacimiento" valor={detalle.alumno.fecha_nacimiento} />
              <Fila etiqueta="Correo" valor={detalle.alumno.email} />
              <Fila etiqueta="Teléfono" valor={detalle.alumno.telefono} />
              <Fila etiqueta="Grado" valor={detalle.alumno.grado} />
              <Fila etiqueta="Grupo" valor={detalle.alumno.grupo} />
              <Fila etiqueta="Institución" valor={detalle.alumno.institucion} />
              <Fila etiqueta="EPS" valor={detalle.alumno.eps} />
              <Fila etiqueta="Dirección" valor={detalle.alumno.direccion} />
              <Fila etiqueta="Ciudad" valor={detalle.alumno.ciudad} />
            </dl>
          </Card>

          {/* Estado de cada documento */}
          <Card sinRelleno>
            <CardHeader
              titulo="Documentos requeridos"
              descripcion="Cuáles ya cargó y cuáles faltan."
              icono={<FileText className="size-5" aria-hidden />}
            />
            <ul className="divide-y divide-tinta-100 border-t border-tinta-200">
              {detalle.requisitos.map((r) => (
                <li key={r.tipo} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={
                        'grid size-8 shrink-0 place-items-center rounded-lg ' +
                        (r.subido ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600')
                      }
                    >
                      {r.subido ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-tinta-800">{r.etiqueta}</p>
                      <p className={'text-xs ' + (r.subido ? 'text-emerald-600' : 'text-amber-600')}>
                        {r.subido ? `Cargado · ${formatearFechaHora(r.creado_en!)}` : 'Falta'}
                      </p>
                    </div>
                  </div>
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-sm font-medium text-marca-600 hover:underline"
                    >
                      Ver
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {/* Fotos cargadas */}
          {cargados.length > 0 && (
            <Card sinRelleno>
              <CardHeader
                titulo="Archivos cargados"
                descripcion="Toca uno para abrirlo en grande."
                icono={<ImageIcon className="size-5" aria-hidden />}
              />
              <div className="grid gap-3 border-t border-tinta-200 p-4 sm:grid-cols-3">
                {cargados.map((r) => {
                  const esImagen = (r.mime ?? '').startsWith('image/');
                  return (
                    <a
                      key={r.tipo}
                      href={r.url!}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex flex-col overflow-hidden rounded-xl border border-tinta-200 transition-colors hover:border-marca-400"
                    >
                      <div className="grid h-36 place-items-center bg-tinta-50">
                        {esImagen ? (
                          <img
                            src={r.url!}
                            alt={r.etiqueta}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <FileText className="size-10 text-tinta-400" aria-hidden />
                        )}
                      </div>
                      <p className="truncate border-t border-tinta-200 p-2.5 text-xs font-medium text-tinta-700 group-hover:text-marca-600">
                        {r.etiqueta}
                      </p>
                    </a>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-xs font-medium tracking-wide text-tinta-400 uppercase">
        {etiqueta}
      </dt>
      <dd className="text-sm text-tinta-800">{valor || '—'}</dd>
    </div>
  );
}

function nombreCompleto(a: AlumnoAutorizacion): string {
  return (
    [a.primer_nombre, a.segundo_nombre, a.primer_apellido, a.segundo_apellido]
      .filter(Boolean)
      .join(' ') || a.numero_documento
  );
}
