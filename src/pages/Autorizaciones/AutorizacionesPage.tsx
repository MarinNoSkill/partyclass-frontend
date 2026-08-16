import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  KeyRound,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/forms/FormField';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import {
  autorizacionesService,
  type AlumnoAutorizacion,
  type DatosAlumno,
} from '@/services/autorizaciones.service';

type Paso = 'documento' | 'codigo' | 'ficha';

const TIPOS_DOC = ['CC', 'TI', 'RC', 'CE', 'PA'] as const;

const CAMPOS: Array<{ clave: keyof DatosAlumno; etiqueta: string; tipo?: string }> = [
  { clave: 'primer_nombre', etiqueta: 'Primer nombre' },
  { clave: 'segundo_nombre', etiqueta: 'Segundo nombre' },
  { clave: 'primer_apellido', etiqueta: 'Primer apellido' },
  { clave: 'segundo_apellido', etiqueta: 'Segundo apellido' },
  { clave: 'fecha_nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date' },
  { clave: 'email', etiqueta: 'Correo', tipo: 'email' },
  { clave: 'telefono', etiqueta: 'Teléfono' },
  { clave: 'grado', etiqueta: 'Grado' },
  { clave: 'grupo', etiqueta: 'Grupo' },
  { clave: 'institucion', etiqueta: 'Institución' },
  { clave: 'eps', etiqueta: 'EPS' },
  { clave: 'direccion', etiqueta: 'Dirección' },
  { clave: 'ciudad', etiqueta: 'Ciudad' },
];

/**
 * Módulo público de Autorizaciones: el estudiante ingresa con su documento
 * (que debe estar permitido) y un código enviado a su correo, y consulta sus
 * datos. Si su ficha está incompleta, primero debe completarla.
 */
export function AutorizacionesPage() {
  const [paso, setPaso] = useState<Paso>('documento');
  const [documento, setDocumento] = useState('');
  const [codigo, setCodigo] = useState('');
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [token, setToken] = useState('');
  const [alumno, setAlumno] = useState<AlumnoAutorizacion | null>(null);
  const [editando, setEditando] = useState(false);
  const [datos, setDatos] = useState<DatosAlumno>({});

  const { exito } = useToast();

  const continuarDocumento = async () => {
    setError(null);
    setCargando(true);
    try {
      const estado = await autorizacionesService.validarDocumento(documento.trim());
      if (!estado.permitido) {
        setError('Este documento no está autorizado para este módulo.');
        return;
      }
      if (!estado.existe) {
        setError('No encontramos un estudiante con ese documento. Contacta al administrador.');
        return;
      }
      if (!estado.tieneCorreo) {
        setError('Tu documento no tiene un correo registrado. Contacta al administrador.');
        return;
      }
      const { correoEnmascarado } = await autorizacionesService.enviarCodigo(documento.trim());
      setCorreo(correoEnmascarado);
      setPaso('codigo');
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

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-tinta-500 hover:text-tinta-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver
      </Link>

      <Card>
        <CardHeader
          titulo="Autorizaciones"
          descripcion="Ingresa con tu documento y un código que enviaremos a tu correo."
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
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            autoFocus
          />
          <Button
            onClick={() => void continuarDocumento()}
            cargando={cargando}
            disabled={documento.trim().length < 4}
            iconoIzquierda={<Mail className="size-4" aria-hidden />}
          >
            Enviarme el código
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
                descripcion="Faltan datos en tu ficha. Complétalos para continuar."
                icono={<BadgeCheck className="size-5" aria-hidden />}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  etiqueta="Tipo de documento"
                  placeholder="Selecciona…"
                  opciones={TIPOS_DOC.map((t) => ({ valor: t, etiqueta: t }))}
                  value={datos.tipo_documento ?? ''}
                  onChange={(e) => setDatos((d) => ({ ...d, tipo_documento: e.target.value }))}
                />
                {CAMPOS.map((c) => (
                  <Input
                    key={c.clave}
                    etiqueta={c.etiqueta}
                    type={c.tipo}
                    value={(datos[c.clave] as string) ?? ''}
                    onChange={(e) => setDatos((d) => ({ ...d, [c.clave]: e.target.value }))}
                  />
                ))}
              </div>
              <Button onClick={() => void guardar()} cargando={cargando}>
                Guardar y continuar
              </Button>
            </Card>
          ) : (
            <Card className="space-y-4">
              <CardHeader
                titulo="Tus datos"
                descripcion="Información registrada del estudiante."
                icono={<BadgeCheck className="size-5" aria-hidden />}
              />
              <dl className="divide-y divide-tinta-100">
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
              <Button variante="contorno" onClick={() => setEditando(true)}>
                Editar datos
              </Button>
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

/** Quita cadenas vacías para no enviar campos en blanco. */
function limpiar(datos: DatosAlumno): DatosAlumno {
  const salida: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(datos)) {
    if (typeof valor === 'string' ? valor.trim() !== '' : valor != null) salida[clave] = valor;
  }
  return salida as DatosAlumno;
}
