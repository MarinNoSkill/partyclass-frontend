import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, KeyRound, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/forms/FormField';
import { PantallaCargando } from '@/components/ui/Spinner';
import { usePlanPorToken } from '@/hooks/usePlanes';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { catalogoService } from '@/services/planes.service';
import { NuevaReservaPage } from './NuevaReservaPage';

/**
 * Inscripción por enlace personalizado (`/inscripcion/:token`).
 *
 * Resuelve el plan por su token y lanza el wizard con ese plan fijado. Si el
 * plan está restringido a ciertos documentos, primero pide el documento y solo
 * deja continuar si está autorizado.
 */
export function InscripcionPage() {
  const { token } = useParams<{ token: string }>();
  const consulta = usePlanPorToken(token);
  const [autorizado, setAutorizado] = useState(false);

  if (consulta.isPending) {
    return <PantallaCargando mensaje="Abriendo el formulario de inscripción…" />;
  }

  if (consulta.isError) {
    return (
      <Aviso
        titulo="Enlace no disponible"
        mensaje={mensajeDeError(consulta.error)}
        pista="Verifica el enlace con quien te lo compartió."
      />
    );
  }

  const plan = consulta.data;

  // Puerta de documento: solo si el plan lo restringe y aún no se validó.
  if (plan.restringidoPorDocumento && !autorizado) {
    return <PuertaDocumento token={token as string} alAutorizar={() => setAutorizado(true)} />;
  }

  return <NuevaReservaPage planInicial={plan} />;
}

// ---------------------------------------------------------------------------

function Aviso({
  titulo,
  mensaje,
  pista,
}: {
  titulo: string;
  mensaje: string;
  pista?: string;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <Card className="max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-tinta-900">{titulo}</h1>
        <p className="mt-2 text-sm text-tinta-500">{mensaje}</p>
        {pista && <p className="mt-1 text-sm text-tinta-400">{pista}</p>}
      </Card>
    </div>
  );
}

interface PropsPuerta {
  token: string;
  alAutorizar: () => void;
}

function PuertaDocumento({ token, alAutorizar }: PropsPuerta) {
  const [documento, setDocumento] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError(null);

    const doc = documento.trim();
    if (doc.length < 4) {
      setError('Ingresa tu número de documento.');
      return;
    }

    setVerificando(true);
    try {
      const valido = await catalogoService.validarDocumentoToken(token, doc);
      if (valido) {
        alAutorizar();
      } else {
        setError(
          'Este documento no está autorizado para diligenciar este plan. Verifica el número o contacta con quien te compartió el enlace.',
        );
      }
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-marca-50 text-marca-600">
            <ShieldCheck className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-lg font-bold text-tinta-900">
            Verifica tu documento
          </h1>
          <p className="mt-1 text-sm text-tinta-500">
            Este plan está reservado para ciertos estudiantes. Ingresa tu número de documento
            para continuar.
          </p>
        </div>

        <form onSubmit={enviar} noValidate className="mt-5 space-y-4">
          <Input
            etiqueta="Número de documento"
            autoFocus
            inputMode="numeric"
            autoComplete="off"
            placeholder="1012345678"
            value={documento}
            onChange={(evento) => setDocumento(evento.target.value)}
            disabled={verificando}
          />

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button
            type="submit"
            anchoCompleto
            cargando={verificando}
            iconoIzquierda={<KeyRound className="size-4" aria-hidden />}
          >
            Continuar
          </Button>
        </form>
      </Card>
    </div>
  );
}
