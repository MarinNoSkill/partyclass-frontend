import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  FileText,
  KeyRound,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/forms/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import {
  autorizacionesService,
  type AlumnoAutorizacion,
  type DatosAlumno,
  type Requisito,
} from '@/services/autorizaciones.service';

type Paso = 'documento' | 'codigo' | 'ficha';

const TIPOS_DOC = ['CC', 'TI', 'RC', 'CE', 'PA'] as const;

type Campo = {
  clave: keyof DatosAlumno;
  etiqueta: string;
  tipo?: string;
  select?: boolean;
  requerido?: boolean;
};

const CAMPOS: Campo[] = [
  { clave: 'tipo_documento', etiqueta: 'Tipo de documento', select: true, requerido: true },
  { clave: 'primer_nombre', etiqueta: 'Primer nombre', requerido: true },
  { clave: 'segundo_nombre', etiqueta: 'Segundo nombre' },
  { clave: 'primer_apellido', etiqueta: 'Primer apellido', requerido: true },
  { clave: 'segundo_apellido', etiqueta: 'Segundo apellido' },
  { clave: 'fecha_nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date', requerido: true },
  { clave: 'email', etiqueta: 'Correo', tipo: 'email', requerido: true },
  { clave: 'telefono', etiqueta: 'Teléfono' },
  { clave: 'grado', etiqueta: 'Grado' },
  { clave: 'grupo', etiqueta: 'Grupo' },
  { clave: 'institucion', etiqueta: 'Institución' },
  { clave: 'eps', etiqueta: 'EPS' },
  { clave: 'direccion', etiqueta: 'Dirección' },
  { clave: 'ciudad', etiqueta: 'Ciudad' },
];

/** Un campo está vacío en la ficha si no trae valor desde la base. */
function vacio(alumno: AlumnoAutorizacion, clave: keyof DatosAlumno): boolean {
  const valor = alumno[clave as keyof AlumnoAutorizacion];
  return typeof valor === 'string' ? valor.trim() === '' : valor == null;
}

/**
 * Módulo público de Autorizaciones: el estudiante ingresa con su documento
 * (que debe estar permitido) y un código enviado a su correo, y consulta sus
 * datos. Si su ficha está incompleta, primero debe completarla.
 */
export function AutorizacionesPage() {
  const [paso, setPaso] = useState<Paso>('documento');
  const [documento, setDocumento] = useState('');
  const [codigo, setCodigo] = useState('');
  const [correo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [token, setToken] = useState('');
  const [alumno, setAlumno] = useState<AlumnoAutorizacion | null>(null);
  const [editando, setEditando] = useState(false);
  const [datos, setDatos] = useState<DatosAlumno>({});
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docMotivo, setDocMotivo] = useState<string | null>(null);
  const [cargandoDoc, setCargandoDoc] = useState(false);

  const { exito } = useToast();

  // Al entrar (con datos completos): carga los requisitos y el documento
  // incrustado (plantilla del plan con los datos ya montados).
  useEffect(() => {
    if (paso !== 'ficha' || editando || !token) return;
    autorizacionesService.requisitos(token).then(setRequisitos).catch(() => undefined);

    let url: string | null = null;
    let vivo = true;
    setCargandoDoc(true);
    setDocMotivo(null);
    setDocUrl(null);
    autorizacionesService
      .estadoDocumento(token)
      .then(async (estado) => {
        if (!vivo) return;
        if (!estado.disponible) {
          setDocMotivo(estado.motivo ?? 'Documento no disponible.');
          return;
        }
        const blob = await autorizacionesService.documentoBlob(token);
        if (!vivo) return;
        url = URL.createObjectURL(blob);
        setDocUrl(url);
      })
      .catch(() => vivo && setDocMotivo('No se pudo cargar el documento.'))
      .finally(() => vivo && setCargandoDoc(false));

    return () => {
      vivo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [paso, editando, token]);

  const subir = async (tipo: string, archivo: File) => {
    setSubiendo(tipo);
    setError(null);
    try {
      await autorizacionesService.cargar(token, tipo, archivo);
      setRequisitos((rs) => rs.map((r) => (r.tipo === tipo ? { ...r, subido: true } : r)));
      exito('Documento subido');
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setSubiendo(null);
    }
  };

  const continuarDocumento = async () => {
    setError(null);
    setCargando(true);
    try {
      // OTP desactivado por ahora: ingreso directo con el documento.
      const ingreso = await autorizacionesService.ingresar(documento.trim());
      setToken(ingreso.token);
      setAlumno(ingreso.alumno);
      setDatos(fichaAEditable(ingreso.alumno));
      setEditando(ingreso.faltanDatos);
      setPaso('ficha');
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setCargando(false);
    }
  };

  const verificar = async () => {
    setError(null);
    setCargando(true);
    try {
      const ingreso = await autorizacionesService.confirmarCodigo(documento.trim(), codigo.trim());
      setToken(ingreso.token);
      setAlumno(ingreso.alumno);
      setDatos(fichaAEditable(ingreso.alumno));
      setEditando(ingreso.faltanDatos);
      setPaso('ficha');
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setCargando(false);
    }
  };

  const guardar = async () => {
    setError(null);
    setCargando(true);
    try {
      const actualizado = await autorizacionesService.completar(token, limpiar(datos));
      setAlumno(actualizado);
      setEditando(!actualizado.datos_completos);
      exito('Datos guardados');
      if (!actualizado.datos_completos) {
        setError('Aún faltan datos obligatorios (nombre, apellido, tipo de documento, fecha de nacimiento y correo).');
      }
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setCargando(false);
    }
  };

  // Solo se piden los datos que faltan; lo que ya está en la base no se edita.
  const faltantes = alumno ? CAMPOS.filter((c) => vacio(alumno, c.clave)) : [];
  const puedeGuardar = faltantes
    .filter((c) => c.requerido)
    .every((c) => ((datos[c.clave] as string) ?? '').trim() !== '');

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-tinta-500 hover:text-tinta-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver
      </Link>

      <Card className="border-marca-100 bg-linear-to-br from-marca-50/60 to-white">
        <CardHeader
          titulo="Autorización de asistencia"
          descripcion={
            paso === 'ficha'
              ? 'Revisa tu documento y sube los documentos requeridos.'
              : 'Ingresa con tu número de documento para continuar.'
          }
          icono={<ShieldCheck className="size-5" aria-hidden />}
        />
      </Card>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {paso === 'documento' && (
        <Card className="space-y-4">
          <Input
            etiqueta="Número de documento"
            name="documento_autorizacion"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
          />
          <Button
            onClick={() => void continuarDocumento()}
            cargando={cargando}
            disabled={documento.trim().length < 4}
            iconoIzquierda={<ShieldCheck className="size-4" aria-hidden />}
          >
            Ingresar
          </Button>
        </Card>
      )}

      {paso === 'codigo' && (
        <Card className="space-y-4">
          <p className="text-sm text-tinta-600">
            Enviamos un código de 6 dígitos a <strong>{correo}</strong>.
          </p>
          <Input
            etiqueta="Código de verificación"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              onClick={() => void verificar()}
              cargando={cargando}
              disabled={codigo.length !== 6}
              iconoIzquierda={<KeyRound className="size-4" aria-hidden />}
            >
              Verificar
            </Button>
            <Button variante="fantasma" onClick={() => setPaso('documento')}>
              Cambiar documento
            </Button>
          </div>
        </Card>
      )}

      {paso === 'ficha' && alumno && (
        <>
          {editando ? (
            <Card className="space-y-4">
              <CardHeader
                titulo="Completa tus datos"
                descripcion="Solo faltan estos datos en tu ficha. Complétalos para continuar; una vez guardados no podrás cambiarlos."
                icono={<BadgeCheck className="size-5" aria-hidden />}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {faltantes.map((c) =>
                  c.select ? (
                    <Select
                      key={c.clave}
                      etiqueta={`${c.etiqueta}${c.requerido ? ' *' : ''}`}
                      placeholder="Selecciona…"
                      opciones={TIPOS_DOC.map((t) => ({ valor: t, etiqueta: t }))}
                      value={(datos[c.clave] as string) ?? ''}
                      onChange={(e) => setDatos((d) => ({ ...d, [c.clave]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      key={c.clave}
                      etiqueta={`${c.etiqueta}${c.requerido ? ' *' : ''}`}
                      type={c.tipo}
                      value={(datos[c.clave] as string) ?? ''}
                      onChange={(e) => setDatos((d) => ({ ...d, [c.clave]: e.target.value }))}
                    />
                  ),
                )}
              </div>
              <Button onClick={() => void guardar()} cargando={cargando} disabled={!puedeGuardar}>
                Guardar y continuar
              </Button>
            </Card>
          ) : (
            <>
            <Card className="space-y-4">
              <CardHeader
                titulo="Tus datos"
                descripcion="Información registrada del estudiante (no editable)."
                icono={<BadgeCheck className="size-5" aria-hidden />}
              />
              <dl className="grid gap-x-8 sm:grid-cols-2">
                <Fila etiqueta="Documento" valor={`${alumno.tipo_documento ?? ''} ${alumno.numero_documento}`} />
                <Fila etiqueta="Nombre" valor={nombre(alumno)} />
                <Fila etiqueta="Fecha de nacimiento" valor={alumno.fecha_nacimiento} />
                <Fila etiqueta="Correo" valor={alumno.email} />
                <Fila etiqueta="Teléfono" valor={alumno.telefono} />
                <Fila etiqueta="Grado" valor={alumno.grado} />
                <Fila etiqueta="Grupo" valor={alumno.grupo} />
                <Fila etiqueta="Institución" valor={alumno.institucion} />
                <Fila etiqueta="EPS" valor={alumno.eps} />
                <Fila etiqueta="Dirección" valor={alumno.direccion} />
                <Fila etiqueta="Ciudad" valor={alumno.ciudad} />
              </dl>
            </Card>

            {/* Documento de autorización del plan, con los datos puestos */}
            <Card className="space-y-3">
              <CardHeader
                titulo="Documento de autorización"
                descripcion="Documento de tu plan con tus datos ya montados."
                icono={<FileText className="size-5" aria-hidden />}
                acciones={
                  docUrl ? (
                    <a
                      href={docUrl}
                      download="autorizacion.pdf"
                      className="text-sm font-medium text-marca-600 hover:underline"
                    >
                      Descargar
                    </a>
                  ) : undefined
                }
              />
              {cargandoDoc ? (
                <div className="grid h-[50vh] place-items-center rounded-xl border border-tinta-200 bg-tinta-50">
                  <div className="text-center">
                    <Spinner className="mx-auto size-7" />
                    <p className="mt-3 text-sm text-tinta-500">Generando tu documento…</p>
                  </div>
                </div>
              ) : docUrl ? (
                <iframe
                  src={docUrl}
                  title="Documento de autorización"
                  className="h-[70vh] w-full rounded-xl border border-tinta-200 bg-tinta-100"
                />
              ) : (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
                  <p className="text-sm text-amber-800">{docMotivo}</p>
                </div>
              )}
            </Card>

            {/* Documentos que debe subir */}
            <Card className="space-y-4">
              <CardHeader
                titulo="Documentos a subir"
                descripcion="Sube una foto (cámara o galería) o un PDF de cada documento."
                icono={<Upload className="size-5" aria-hidden />}
                acciones={
                  requisitos.length > 0 ? (
                    <span className="rounded-full bg-tinta-100 px-2.5 py-1 text-xs font-semibold text-tinta-600">
                      {requisitos.filter((r) => r.subido).length}/{requisitos.length}
                    </span>
                  ) : undefined
                }
              />
              {requisitos.length === 0 ? (
                <div className="grid h-24 place-items-center">
                  <Spinner className="size-6" />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {requisitos.map((r) => (
                    <FilaRequisito
                      key={r.tipo}
                      req={r}
                      subiendo={subiendo === r.tipo}
                      onSubir={(f) => void subir(r.tipo, f)}
                    />
                  ))}
                </div>
              )}
            </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-xs font-medium tracking-wide text-tinta-400 uppercase">
        {etiqueta}
      </dt>
      <dd className="text-sm text-tinta-800">{valor || '—'}</dd>
    </div>
  );
}

function nombre(a: AlumnoAutorizacion): string {
  return [a.primer_nombre, a.segundo_nombre, a.primer_apellido, a.segundo_apellido]
    .filter(Boolean)
    .join(' ');
}

function fichaAEditable(a: AlumnoAutorizacion): DatosAlumno {
  return {
    tipo_documento: a.tipo_documento ?? undefined,
    primer_nombre: a.primer_nombre ?? undefined,
    segundo_nombre: a.segundo_nombre ?? undefined,
    primer_apellido: a.primer_apellido ?? undefined,
    segundo_apellido: a.segundo_apellido ?? undefined,
    fecha_nacimiento: a.fecha_nacimiento ?? undefined,
    email: a.email ?? undefined,
    telefono: a.telefono ?? undefined,
    grado: a.grado ?? undefined,
    grupo: a.grupo ?? undefined,
    institucion: a.institucion ?? undefined,
    eps: a.eps ?? undefined,
    direccion: a.direccion ?? undefined,
    ciudad: a.ciudad ?? undefined,
  };
}

function FilaRequisito({
  req,
  subiendo,
  onSubir,
}: {
  req: Requisito;
  subiendo: boolean;
  onSubir: (archivo: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      className={
        'flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ' +
        (req.subido ? 'border-emerald-200 bg-emerald-50/50' : 'border-tinta-200 bg-white')
      }
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={
            'grid size-9 shrink-0 place-items-center rounded-lg ' +
            (req.subido ? 'bg-emerald-100 text-emerald-600' : 'bg-tinta-100 text-tinta-500')
          }
        >
          {req.subido ? <Check className="size-5" aria-hidden /> : <FileText className="size-5" aria-hidden />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-tinta-800">{req.etiqueta}</p>
          <p className={'text-xs ' + (req.subido ? 'text-emerald-600' : 'text-tinta-400')}>
            {req.subido ? 'Subido' : 'Pendiente'}
          </p>
        </div>
      </div>
      <Button
        variante={req.subido ? 'fantasma' : 'contorno'}
        tamano="sm"
        cargando={subiendo}
        onClick={() => input.current?.click()}
        iconoIzquierda={<Upload className="size-4" aria-hidden />}
      >
        {req.subido ? 'Cambiar' : 'Subir'}
      </Button>
      {/* accept sin capture: en móvil ofrece cámara/galería/archivos; en PC, archivos */}
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) onSubir(f);
        }}
      />
    </div>
  );
}

/** Quita cadenas vacías para no enviar campos en blanco. */
function limpiar(datos: DatosAlumno): DatosAlumno {
  const salida: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(datos)) {
    if (typeof valor === 'string' ? valor.trim() !== '' : valor != null) salida[clave] = valor;
  }
  return salida as DatosAlumno;
}
