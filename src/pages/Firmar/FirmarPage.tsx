import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, PenTool, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PantallaCargando } from '@/components/ui/Spinner';
import { SignaturePad, type ManejadorSignaturePad } from '@/components/signature/SignaturePad';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { firmaRemotaService, type ContextoFirma } from '@/services/firmaRemota.service';

/**
 * Página pública de firma (`/firmar/:token`).
 *
 * La abre el acudiente desde el enlace del correo. Muestra el texto de
 * autorización y captura su firma; al enviarla, queda pegada al registro y el
 * estudiante (que espera en su pantalla) puede continuar.
 */
export function FirmarPage() {
  const { token } = useParams<{ token: string }>();
  const [contexto, setContexto] = useState<ContextoFirma | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [firmado, setFirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [tieneTrazo, setTieneTrazo] = useState(false);

  const padRef = useRef<ManejadorSignaturePad>(null);
  const { error: mostrarError } = useToast();

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    firmaRemotaService
      .contexto(token)
      .then((ctx) => {
        if (!vivo) return;
        setContexto(ctx);
        setFirmado(ctx.yaFirmado);
      })
      .catch((fallo) => vivo && setErrorCarga(mensajeDeError(fallo)))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [token]);

  const enviarFirma = useCallback(async () => {
    const imagen = padRef.current?.exportarPng();
    if (!imagen) {
      mostrarError('Firma vacía', 'Dibuja tu firma antes de enviarla.');
      return;
    }
    setEnviando(true);
    try {
      await firmaRemotaService.firmar(token as string, imagen);
      setFirmado(true);
    } catch (fallo) {
      mostrarError('No se pudo registrar la firma', mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  }, [token, mostrarError]);

  if (cargando) return <PantallaCargando mensaje="Abriendo tu firma…" />;

  if (errorCarga) {
    return (
      <Aviso
        tono="error"
        titulo="Enlace no disponible"
        mensaje={errorCarga}
        pista="Verifica el enlace o pide que te lo reenvíen."
      />
    );
  }

  if (contexto?.finalizado && !firmado) {
    return (
      <Aviso
        tono="error"
        titulo="Este registro ya se finalizó"
        mensaje="La firma ya no es necesaria."
      />
    );
  }

  if (contexto?.expirado && !firmado) {
    return (
      <Aviso
        tono="error"
        titulo="El enlace expiró"
        mensaje="Pídele al operador que reinicie el proceso de firma."
      />
    );
  }

  if (firmado) {
    return (
      <Aviso
        tono="exito"
        titulo="¡Firma registrada!"
        mensaje={`Gracias, ${contexto?.acudienteNombre ?? ''}. Tu autorización quedó guardada. Ya puedes cerrar esta página.`}
      />
    );
  }

  const parentesco = contexto?.rol === 'PADRE' ? 'padre' : 'madre';

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-lg place-items-center px-4 py-8">
      <Card className="w-full">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-marca-50 text-marca-600">
            <PenTool className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-marca-600 uppercase">
              PartyClass · {contexto?.planNombre}
            </p>
            <h1 className="mt-0.5 text-lg font-semibold text-tinta-900">
              Firma de autorización
            </h1>
          </div>
        </div>

        <p className="mt-5 text-sm text-tinta-700">
          Hola <strong>{contexto?.acudienteNombre}</strong>, como {parentesco} de{' '}
          <strong>{contexto?.estudianteNombre}</strong>:
        </p>

        <div className="mt-3 rounded-xl border border-marca-100 bg-marca-50/60 p-4">
          <p className="text-sm leading-relaxed text-tinta-800">
            Al firmar declaro que, de manera libre y voluntaria,{' '}
            <strong>autorizo a mi hijo(a) {contexto?.estudianteNombre}</strong> a participar en
            las actividades del convenio de reserva de PartyClass, y que he leído y acepto sus
            términos y condiciones. Entiendo que mi firma digital tiene plena validez y quedará
            incorporada al convenio.
          </p>
        </div>

        <div className="mt-5">
          <SignaturePad
            ref={padRef}
            etiqueta={`Firma ${parentesco === 'padre' ? 'del padre' : 'de la madre'}`}
            alCambiar={setTieneTrazo}
          />
        </div>

        <Button
          className="mt-5 w-full"
          onClick={() => void enviarFirma()}
          disabled={!tieneTrazo}
          cargando={enviando}
          iconoIzquierda={<ShieldCheck className="size-4" aria-hidden />}
        >
          Firmar y autorizar
        </Button>

        <p className="mt-3 text-center text-xs text-tinta-400">
          Tu firma solo se usa para este convenio.
        </p>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Aviso({
  tono,
  titulo,
  mensaje,
  pista,
}: {
  tono: 'error' | 'exito';
  titulo: string;
  mensaje: string;
  pista?: string;
}) {
  const estilos =
    tono === 'exito'
      ? { fondo: 'bg-emerald-50 text-emerald-600', icono: <CheckCircle2 className="size-6" aria-hidden /> }
      : { fondo: 'bg-amber-50 text-amber-600', icono: <AlertTriangle className="size-6" aria-hidden /> };

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <Card className="max-w-md text-center">
        <span className={`mx-auto grid size-12 place-items-center rounded-2xl ${estilos.fondo}`}>
          {estilos.icono}
        </span>
        <h1 className="mt-4 text-lg font-semibold text-tinta-900">{titulo}</h1>
        <p className="mt-2 text-sm text-tinta-500">{mensaje}</p>
        {pista && <p className="mt-1 text-sm text-tinta-400">{pista}</p>}
      </Card>
    </div>
  );
}
