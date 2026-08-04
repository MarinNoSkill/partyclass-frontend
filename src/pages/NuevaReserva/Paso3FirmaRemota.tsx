import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  Send,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StepperNav } from '@/components/stepper/StepperNav';
import { ErrorApi } from '@/services/http';
import { mensajeDeError } from '@/hooks/useMensajeError';
import {
  firmaRemotaService,
  type EstadoSolicitud,
} from '@/services/firmaRemota.service';
import { ETIQUETA_ROL } from '@/utils/formato';
import type { RegistroEnCurso } from '@/hooks/useRegistroBorrador';
import type { RolAcudiente } from '@/types/dominio.types';

interface PropsPaso3 {
  registro: RegistroEnCurso;
  solicitudId: string | null;
  alSolicitudCreada: (id: string) => void;
  alContinuar: () => void;
  alRetroceder: () => void;
  /** El backend rechazó por dato duplicado (documento/correo). */
  alErrorDeDatos: (codigo: string) => void;
}

const ROLES: RolAcudiente[] = ['PADRE', 'MADRE'];
const CODIGOS_DATO_DUPLICADO = ['DOCUMENTO_DUPLICADO', 'CORREO_DUPLICADO', 'CORREO_REGISTRADO'];
const INTERVALO_MS = 4000;

const nombreAcudiente = (a: {
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
}) =>
  [a.primer_nombre, a.segundo_nombre, a.primer_apellido, a.segundo_apellido]
    .filter(Boolean)
    .join(' ');

/**
 * Paso 3 (firma remota). En vez de firmar aquí, se envía a cada acudiente un
 * correo con un enlace único para firmar. La pantalla espera y se actualiza
 * sola hasta que todos firmen; entonces se puede continuar.
 */
export function Paso3FirmaRemota({
  registro,
  solicitudId,
  alSolicitudCreada,
  alContinuar,
  alRetroceder,
  alErrorDeDatos,
}: PropsPaso3) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoSolicitud | null>(null);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);

  const registrados = ROLES.filter((rol) => registro.acudientes[rol]);

  // Sondea el estado de las firmas mientras haya una solicitud abierta.
  useEffect(() => {
    if (!solicitudId) {
      setEstado(null);
      return;
    }
    let vivo = true;
    const consultar = () =>
      firmaRemotaService
        .estado(solicitudId)
        .then((e) => {
          if (!vivo) return;
          setEstado(e);
          setErrorEstado(null);
        })
        .catch((fallo) => {
          // Se muestra para no quedarnos «esperando» sin explicación.
          if (vivo) setErrorEstado(mensajeDeError(fallo));
        });

    void consultar();
    const id = window.setInterval(consultar, INTERVALO_MS);
    return () => {
      vivo = false;
      window.clearInterval(id);
    };
  }, [solicitudId]);

  const enviar = useCallback(async () => {
    if (!registro.plan || !registro.estudiante) {
      setError('Faltan datos del plan o del estudiante. Revisa los pasos anteriores.');
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const { solicitudId: nuevo } = await firmaRemotaService.iniciar({
        plan_id: registro.plan.id,
        estudiante: registro.estudiante,
        acudientes: registrados.map((rol) => ({ ...registro.acudientes[rol]!, rol })),
      });
      alSolicitudCreada(nuevo);
    } catch (fallo) {
      if (fallo instanceof ErrorApi && CODIGOS_DATO_DUPLICADO.includes(fallo.codigo)) {
        alErrorDeDatos(fallo.codigo);
      } else {
        setError(mensajeDeError(fallo));
      }
    } finally {
      setEnviando(false);
    }
  }, [registro, registrados, alSolicitudCreada, alErrorDeDatos]);

  const todosFirmaron = estado?.todosFirmaron ?? false;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          titulo="Firma de los acudientes"
          descripcion="Se enviará un correo a cada acudiente con un enlace para autorizar y firmar. Esta pantalla se actualiza sola cuando firmen."
          icono={<Mail className="size-5" aria-hidden />}
        />
      </Card>

      {registrados.length === 0 ? (
        <Card>
          <p className="text-sm text-tinta-500">
            Debes registrar al menos un acudiente en el paso 2.
          </p>
        </Card>
      ) : !solicitudId ? (
        <Card className="space-y-4">
          <p className="text-sm text-tinta-700">Vamos a enviar el enlace de firma a:</p>
          <ul className="space-y-2">
            {registrados.map((rol) => {
              const a = registro.acudientes[rol]!;
              return (
                <li
                  key={rol}
                  className="flex flex-col gap-1 rounded-xl border border-tinta-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-tinta-900">{ETIQUETA_ROL[rol]}</p>
                    <p className="truncate text-sm text-tinta-500">{nombreAcudiente(a)}</p>
                  </div>
                  <span className="truncate text-sm text-tinta-600">{a.email || 'Sin correo'}</span>
                </li>
              );
            })}
          </ul>

          {registrados.some((rol) => !registro.acudientes[rol]!.email) && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
              <p className="text-sm text-amber-800">
                Cada acudiente necesita un correo para recibir el enlace. Vuelve al paso 2 y agrégalo.
              </p>
            </div>
          )}

          <Button
            onClick={() => void enviar()}
            cargando={enviando}
            iconoIzquierda={<Send className="size-4" aria-hidden />}
          >
            Enviar correos de firma
          </Button>
        </Card>
      ) : (
        <Card className="space-y-3">
          <p className="text-sm text-tinta-700">
            Enviamos el enlace de firma. Puedes <strong>continuar sin esperar</strong>: el
            convenio saldrá marcado como <strong>PENDIENTE</strong> y, cuando cada acudiente
            firme desde su correo, se completa solo.
          </p>
          <ul className="space-y-2">
            {(estado?.firmantes ??
              registrados.map((rol) => ({ rol, emailEnmascarado: '', firmado: false }))
            ).map((f) => (
              <li
                key={f.rol}
                className="flex items-center justify-between gap-3 rounded-xl border border-tinta-200 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-tinta-900">{ETIQUETA_ROL[f.rol]}</p>
                  {f.emailEnmascarado && (
                    <p className="truncate text-sm text-tinta-500">{f.emailEnmascarado}</p>
                  )}
                </div>
                {f.firmado ? (
                  <Badge tono="exito">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    Firmó
                  </Badge>
                ) : (
                  <Badge tono="neutro">
                    <Clock className="size-3.5" aria-hidden />
                    Esperando…
                  </Badge>
                )}
              </li>
            ))}
          </ul>
          {errorEstado && (
            <p className="text-sm text-red-600">
              No se pudo consultar el estado: {errorEstado}
            </p>
          )}

          <button
            type="button"
            onClick={() => void enviar()}
            disabled={enviando}
            className="text-sm font-medium text-marca-600 hover:underline disabled:opacity-50"
          >
            Reenviar los correos
          </button>
        </Card>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Card>
        <StepperNav
          puedeRetroceder
          // Basta con haber enviado los correos: se puede continuar aunque aún
          // no hayan firmado (el registro queda pendiente).
          puedeAvanzar={Boolean(solicitudId)}
          esUltimoPaso={false}
          alRetroceder={alRetroceder}
          alAvanzar={alContinuar}
          etiquetaAvanzar={
            todosFirmaron ? 'Continuar a confirmación' : 'Continuar (pendiente de firmas)'
          }
          mensajeBloqueo={
            solicitudId ? undefined : 'Envía los correos de firma para continuar.'
          }
        />
      </Card>
    </div>
  );
}
