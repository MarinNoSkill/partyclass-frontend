import { useState } from 'react';
import {
  AlertTriangle,
  ClipboardCheck,
  FileSignature,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StepperNav } from '@/components/stepper/StepperNav';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { ErrorApi } from '@/services/http';
import { registroService } from '@/services/registro.service';
import type { RegistroCreado } from '@/services/registro.service';
import { ETIQUETA_ROL, formatearFechaSimple } from '@/utils/formato';
import type { RegistroEnCurso } from '@/hooks/useRegistroBorrador';
import type { RolAcudiente } from '@/types/dominio.types';

interface PropsPaso4 {
  registro: RegistroEnCurso;
  alRetroceder: () => void;
  alRegistrar: (resultado: RegistroCreado) => void;
  /**
   * El backend rechazó por un dato duplicado (documento o correo). Recibe el
   * código para que el orquestador muestre el modal correspondiente.
   */
  alErrorDeDatos: (codigo: string) => void;
}

const CODIGOS_DATO_DUPLICADO = [
  'DOCUMENTO_DUPLICADO',
  'CORREO_DUPLICADO',
  'CORREO_REGISTRADO',
];

const ROLES: RolAcudiente[] = ['PADRE', 'MADRE'];

function FilaResumen({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-56 shrink-0 text-xs font-medium tracking-wide text-tinta-400 uppercase">
        {etiqueta}
      </dt>
      <dd className="text-sm text-tinta-800">{valor}</dd>
    </div>
  );
}

function nombreDe(persona: {
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
}): string {
  return [
    persona.primer_nombre,
    persona.segundo_nombre,
    persona.primer_apellido,
    persona.segundo_apellido,
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Paso 4. Es el único punto del wizard que escribe en el servidor.
 *
 * Al confirmar se envía todo el registro de una vez: el backend crea las
 * filas, sube las firmas, asigna el número de sorteo y genera el convenio.
 * Si algo falla, no queda nada a medias.
 */
export function Paso4Confirmacion({
  registro,
  alRetroceder,
  alRegistrar,
  alErrorDeDatos,
}: PropsPaso4) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { exito } = useToast();

  const { plan, estudiante } = registro;
  const acudientesRegistrados = ROLES.filter((rol) => registro.acudientes[rol]);

  /** Datos del registro listos para enviar. */
  const construirPayload = () => ({
    plan_id: plan!.id,
    estudiante: estudiante!,
    acudientes: acudientesRegistrados.map((rol) => ({
      ...registro.acudientes[rol]!,
      rol,
    })),
    firmas: acudientesRegistrados.map((rol) => ({
      rol,
      imagenBase64: registro.firmas[rol]!,
    })),
  });

  const finalizar = async () => {
    if (!plan || !estudiante) {
      setError('Faltan datos del plan o del estudiante. Revisa los pasos anteriores.');
      return;
    }

    setError(null);
    setEnviando(true);

    try {
      const resultado = await registroService.crear(construirPayload());

      exito(
        'Registro creado',
        `Convenio ${resultado.codigo} · ${resultado.numerosConvenio.length} boleta(s)`,
      );

      // El padre decide qué mostrar: guarda el resultado y limpia el wizard.
      alRegistrar(resultado);
    } catch (fallo) {
      // Dato duplicado (documento o correo): el orquestador muestra su modal.
      if (fallo instanceof ErrorApi && CODIGOS_DATO_DUPLICADO.includes(fallo.codigo)) {
        alErrorDeDatos(fallo.codigo);
      } else {
        setError(mensajeDeError(fallo));
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <CardHeader
          titulo="Revisa la información"
          descripcion="Nada se ha guardado todavía. Al confirmar se creará el registro y se generará el convenio con su número de sorteo."
          icono={<ClipboardCheck className="size-5" aria-hidden />}
          acciones={plan ? <Badge tono="marca">{plan.anio}</Badge> : undefined}
        />

        <dl className="divide-y divide-tinta-100">
          <FilaResumen etiqueta="Plan" valor={plan?.nombre ?? '—'} />

          <FilaResumen
            etiqueta="Estudiante"
            valor={estudiante ? nombreDe(estudiante) : '—'}
          />
          <FilaResumen
            etiqueta="Documento"
            valor={
              estudiante
                ? `${estudiante.tipo_documento} ${estudiante.numero_documento}`
                : '—'
            }
          />
          <FilaResumen
            etiqueta="Fecha de nacimiento"
            valor={estudiante ? formatearFechaSimple(estudiante.fecha_nacimiento) : '—'}
          />
          <FilaResumen etiqueta="Colegio" valor={estudiante?.institucion || '—'} />
          <FilaResumen etiqueta="Grado" valor={estudiante?.grado || '—'} />

          {acudientesRegistrados.map((rol) => {
            const acudiente = registro.acudientes[rol]!;
            return (
              <FilaResumen
                key={rol}
                etiqueta={ETIQUETA_ROL[rol]}
                valor={`${nombreDe(acudiente)} · ${acudiente.tipo_documento} ${acudiente.numero_documento} · ${acudiente.telefono}`}
              />
            );
          })}

          <FilaResumen
            etiqueta="Firmas"
            valor={acudientesRegistrados
              .map((rol) => `${ETIQUETA_ROL[rol]} ✓`)
              .join(' · ')}
          />
        </dl>
      </Card>

      {/* Firmas capturadas, tal como se incrustarán */}
      <Card>
        <CardHeader
          titulo="Firmas capturadas"
          descripcion="Así quedarán en el convenio."
          icono={<FileSignature className="size-5" aria-hidden />}
          className="mb-4"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {acudientesRegistrados.map((rol) => (
            <div key={rol} className="rounded-xl border border-tinta-200 p-3">
              <p className="mb-2 text-xs font-medium text-tinta-500">{ETIQUETA_ROL[rol]}</p>
              <div className="grid h-28 place-items-center rounded-lg bg-white">
                <img
                  src={registro.firmas[rol]}
                  alt={`Firma ${rol.toLowerCase()}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
          <div className="text-sm text-red-800">
            <p className="font-medium">No se pudo crear el registro</p>
            <p className="mt-0.5">{error}</p>
            <p className="mt-1.5 text-red-700">
              Tus datos siguen aquí: corrige lo indicado y vuelve a intentarlo.
            </p>
          </div>
        </div>
      )}

      <Card>
        <StepperNav
          puedeRetroceder
          puedeAvanzar
          esUltimoPaso
          cargando={enviando}
          alRetroceder={alRetroceder}
          alAvanzar={() => void finalizar()}
          etiquetaAvanzar="Confirmar y generar convenio"
        />
      </Card>

    </div>
  );
}
