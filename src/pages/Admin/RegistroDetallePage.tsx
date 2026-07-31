import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Hash,
  PenLine,
  RefreshCw,
  User,
  Users,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, BadgeEstado } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuditoriaReserva } from '@/hooks/useNumeracion';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { registroService } from '@/services/registro.service';
import {
  formatearBytes,
  formatearFecha,
  formatearFechaHora,
  nombreCompleto,
} from '@/utils/formato';
import type {
  FirmaAuditoria,
  IntegridadReserva,
  ReservaAuditoria,
} from '@/types/dominio.types';

export function RegistroDetallePage() {
  const { id } = useParams<{ id: string }>();
  const consulta = useAuditoriaReserva(id);

  if (consulta.isPending) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner />
      </div>
    );
  }

  if (consulta.isError) {
    return (
      <Card>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {mensajeDeError(consulta.error)}
        </p>
        <Link
          to="/admin/registros"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-marca-600 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver al listado
        </Link>
      </Card>
    );
  }

  const reserva = consulta.data;

  return (
    <div className="space-y-5">
      <Link
        to="/admin/registros"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-tinta-500 transition-colors hover:text-tinta-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al listado
      </Link>

      <Cabecera reserva={reserva} />
      <PanelIntegridad integridad={reserva.integridad} />

      <div className="grid gap-5 xl:grid-cols-2">
        <BloqueEstudiante reserva={reserva} />
        <BloqueAcudientes reserva={reserva} />
      </div>

      <BloqueFirmas firmas={reserva.firmas} />
      <BloqueContrato reserva={reserva} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function Cabecera({ reserva }: { reserva: ReservaAuditoria }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-tinta-900">{reserva.codigo}</h1>
            <BadgeEstado estado={reserva.estado} />
          </div>
          <p className="mt-1 text-sm text-tinta-500">
            Creada el {formatearFechaHora(reserva.created_at)}
            {reserva.finalizada_en
              ? ` · Finalizada el ${formatearFechaHora(reserva.finalizada_en)}`
              : ''}
          </p>
        </div>

        {reserva.numerosConvenio.length > 0 && (
          <div className="rounded-xl border border-marca-200 bg-marca-50 px-4 py-2.5 text-right">
            <p className="flex items-center justify-end gap-1 text-[11px] font-medium tracking-wide text-marca-700 uppercase">
              <Hash className="size-3" aria-hidden />
              Boletas de sorteo
            </p>
            <p className="flex flex-wrap justify-end gap-x-3 font-mono text-2xl font-semibold text-marca-700">
              {reserva.numerosConvenio.map((numero) => (
                <span key={numero}>{numero}</span>
              ))}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function PanelIntegridad({ integridad }: { integridad: IntegridadReserva }) {
  const problemas: string[] = [];

  if (!integridad.tieneEstudiante) problemas.push('No hay datos del estudiante.');
  if (integridad.totalAcudientes === 0) problemas.push('No hay ningún acudiente registrado.');
  for (const rol of integridad.acudientesSinFirma) {
    problemas.push(`El acudiente ${rol.toLowerCase()} no ha firmado.`);
  }
  if (!integridad.tieneContrato) problemas.push('No se ha generado el convenio PDF.');
  if (integridad.tieneContrato && !integridad.contratoPosteriorAFirmas) {
    problemas.push('El convenio es anterior a la última firma: está desactualizado.');
  }

  const correcto = problemas.length === 0;

  return (
    <Card
      className={
        correcto ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl ${
            correcto ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {correcto ? (
            <CheckCircle2 className="size-5" aria-hidden />
          ) : (
            <AlertTriangle className="size-5" aria-hidden />
          )}
        </span>

        <div className="min-w-0">
          <p
            className={`font-medium ${correcto ? 'text-emerald-900' : 'text-amber-900'}`}
          >
            {correcto ? 'Registro completo y coherente' : 'Registro incompleto'}
          </p>

          {correcto ? (
            <p className="mt-0.5 text-sm text-emerald-800">
              Estudiante, acudientes, firmas y convenio están presentes y en orden.
            </p>
          ) : (
            <ul className="mt-1.5 space-y-1 text-sm text-amber-900">
              {problemas.map((problema) => (
                <li key={problema} className="flex gap-1.5">
                  <span aria-hidden>·</span>
                  {problema}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-tinta-500">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm break-words text-tinta-900">
        {valor && valor.trim() !== '' ? valor : '—'}
      </dd>
    </div>
  );
}

function BloqueEstudiante({ reserva }: { reserva: ReservaAuditoria }) {
  const estudiante = reserva.estudiante;

  return (
    <Card>
      <CardHeader
        titulo="Estudiante"
        icono={<User className="size-5" aria-hidden />}
        className="mb-4"
      />

      {!estudiante ? (
        <p className="text-sm text-tinta-400">Sin datos registrados.</p>
      ) : (
        <dl className="grid gap-4 sm:grid-cols-2">
          <Dato etiqueta="Nombre completo" valor={nombreCompleto(estudiante)} />
          <Dato
            etiqueta="Documento"
            valor={`${estudiante.tipo_documento} ${estudiante.numero_documento}`}
          />
          <Dato
            etiqueta="Fecha de nacimiento"
            valor={formatearFecha(estudiante.fecha_nacimiento)}
          />
          <Dato etiqueta="Género" valor={estudiante.genero} />
          <Dato etiqueta="Grado" valor={estudiante.grado} />
          <Dato etiqueta="Institución" valor={estudiante.institucion} />
          <Dato etiqueta="Teléfono" valor={estudiante.telefono} />
          <Dato etiqueta="Correo" valor={estudiante.email} />
          <Dato etiqueta="Dirección" valor={estudiante.direccion} />
          <Dato etiqueta="Ciudad" valor={estudiante.ciudad} />
        </dl>
      )}
    </Card>
  );
}

function BloqueAcudientes({ reserva }: { reserva: ReservaAuditoria }) {
  return (
    <Card>
      <CardHeader
        titulo="Acudientes"
        icono={<Users className="size-5" aria-hidden />}
        className="mb-4"
      />

      {reserva.acudientes.length === 0 ? (
        <p className="text-sm text-tinta-400">Sin acudientes registrados.</p>
      ) : (
        <div className="space-y-5">
          {reserva.acudientes.map((acudiente) => (
            <div
              key={acudiente.id}
              className="rounded-xl border border-tinta-200 bg-tinta-50/50 p-4"
            >
              <Badge tono="marca">
                {acudiente.rol === 'PADRE' ? 'Padre' : 'Madre'}
              </Badge>

              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <Dato etiqueta="Nombre completo" valor={nombreCompleto(acudiente)} />
                <Dato
                  etiqueta="Documento"
                  valor={`${acudiente.tipo_documento} ${acudiente.numero_documento}`}
                />
                <Dato etiqueta="Teléfono" valor={acudiente.telefono} />
                <Dato etiqueta="Correo" valor={acudiente.email} />
                <Dato etiqueta="Ocupación" valor={acudiente.ocupacion} />
                <Dato etiqueta="Ciudad" valor={acudiente.ciudad} />
                <Dato etiqueta="Dirección" valor={acudiente.direccion} />
              </dl>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function BloqueFirmas({ firmas }: { firmas: FirmaAuditoria[] }) {
  return (
    <Card>
      <CardHeader
        titulo="Firmas digitales"
        descripcion="Imagen PNG tal como quedó almacenada y embebida en el convenio."
        icono={<PenLine className="size-5" aria-hidden />}
        className="mb-4"
      />

      {firmas.length === 0 ? (
        <p className="text-sm text-tinta-400">Sin firmas registradas.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {firmas.map((firma) => (
            <div key={firma.id} className="rounded-xl border border-tinta-200 p-4">
              <div className="flex items-center justify-between">
                <Badge tono="marca">
                  {firma.rol === 'PADRE' ? 'Firma del padre' : 'Firma de la madre'}
                </Badge>
                <span className="text-xs text-tinta-400">
                  {formatearFechaHora(firma.firmada_en)}
                </span>
              </div>

              <div className="mt-3 h-40 overflow-hidden rounded-lg border border-dashed border-tinta-300 bg-white p-2">
                {firma.url ? (
                  <img
                    src={firma.url}
                    alt={`Firma de ${firma.rol.toLowerCase()}`}
                    className="mx-auto h-full w-full object-contain"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <span className="text-xs text-red-600">
                      El archivo no está disponible en Storage.
                    </span>
                  </div>
                )}
              </div>

              <p className="mt-2 text-xs text-tinta-400">
                {firma.ancho_px} × {firma.alto_px} px ·{' '}
                {formatearBytes(firma.tamano_bytes)} · relación{' '}
                {firma.relacionAspecto.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function BloqueContrato({ reserva }: { reserva: ReservaAuditoria }) {
  const contrato = reserva.contrato;
  const cliente = useQueryClient();
  const toast = useToast();

  const regenerar = useMutation({
    mutationFn: () => registroService.regenerarConvenio(reserva.id),
    onSuccess: () => {
      // Recarga la auditoría: trae una signed URL nueva, y con ella el iframe
      // muestra el PDF recién hecho en vez del que tenía cacheado.
      void cliente.invalidateQueries({ queryKey: ['auditoria', reserva.id] });
      toast.exito('Convenio regenerado', 'Conserva el mismo número de sorteo.');
    },
    onError: (fallo) => toast.error(mensajeDeError(fallo)),
  });

  return (
    <Card>
      <CardHeader
        titulo="Convenio PDF"
        icono={<FileText className="size-5" aria-hidden />}
        acciones={
          contrato ? (
            <Button
              variante="contorno"
              tamano="sm"
              cargando={regenerar.isPending}
              onClick={() => regenerar.mutate()}
              iconoIzquierda={<RefreshCw className="size-4" aria-hidden />}
            >
              Regenerar
            </Button>
          ) : undefined
        }
        className="mb-4"
      />

      {!contrato ? (
        <p className="text-sm text-tinta-400">Todavía no se ha generado el convenio.</p>
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Dato
              etiqueta="Boletas de sorteo"
              valor={reserva.numerosConvenio.join(', ') || null}
            />
            <Dato etiqueta="Generado el" valor={formatearFechaHora(contrato.generado_en)} />
            <Dato etiqueta="Plantilla" valor={contrato.version_plantilla} />
            <Dato etiqueta="Tamaño" valor={formatearBytes(contrato.tamano_bytes)} />
          </dl>

          {contrato.hash_sha256 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-tinta-500">
                Huella SHA-256 (verifica que el PDF no fue alterado)
              </p>
              <p className="mt-1 rounded-lg bg-tinta-900 px-3 py-2 font-mono text-xs break-all text-tinta-100">
                {contrato.hash_sha256}
              </p>
            </div>
          )}

          {contrato.url && (
            <>
              <a
                href={contrato.url}
                download={`convenio-${reserva.codigo}.pdf`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-marca-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-marca-700"
              >
                <Download className="size-4" aria-hidden />
                Descargar convenio
              </a>

              {/* El documento archivado, tal cual quedó. El enlace es firmado
                  y caduca a los 5 minutos, así que no se puede compartir. */}
              <iframe
                src={contrato.url}
                title={`Convenio ${reserva.codigo}`}
                className="mt-4 h-[70vh] w-full rounded-xl border border-tinta-200 bg-tinta-100"
              />
            </>
          )}
        </>
      )}
    </Card>
  );
}
