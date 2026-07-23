import { useState } from 'react';
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { verificacionService } from '@/services/verificacion.service';
import { mensajeDeError } from '@/hooks/useMensajeError';

interface Props {
  /** Email guardado en el paso 2 (se le envía el código). */
  email: string;
  etiqueta: string;
  alVerificar: () => void;
}

type Fase = 'inicial' | 'codigo';

/**
 * Verificación del email de un acudiente por código, antes de firmar.
 *
 * El backend genera y valida el código (Resend envía el correo). Al confirmar
 * el código correcto se llama `alVerificar`, que desbloquea la firma de ese
 * acudiente. Padre y madre se verifican por separado.
 */
export function VerificacionEmail({ email, etiqueta, alVerificar }: Props) {
  const [fase, setFase] = useState<Fase>('inicial');
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviarCodigo = async () => {
    setError(null);
    setEnviando(true);
    try {
      await verificacionService.enviar(email);
      setFase('codigo');
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  };

  const confirmar = async () => {
    if (codigo.length < 6) return;
    setError(null);
    setVerificando(true);
    try {
      await verificacionService.confirmar(email, codigo);
      alVerificar();
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="grid min-h-44 place-items-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 px-4 py-5 text-center sm:min-h-52">
      <div className="w-full max-w-xs">
        <span className="mx-auto grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
          <ShieldCheck className="size-5" aria-hidden />
        </span>

        {fase === 'inicial' ? (
          <>
            <p className="mt-3 text-sm font-medium text-tinta-900">
              Verifica el correo {etiqueta}
            </p>
            <p className="mt-1 text-xs break-all text-tinta-500">
              Enviaremos un código a <strong>{email}</strong> para habilitar la firma.
            </p>
            <Button
              className="mt-4"
              tamano="sm"
              cargando={enviando}
              onClick={() => void enviarCodigo()}
              iconoIzquierda={<Mail className="size-4" aria-hidden />}
            >
              Enviar código
            </Button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-medium text-tinta-900">Ingresa el código</p>
            <p className="mt-1 text-xs break-all text-tinta-500">Enviado a {email}.</p>
            <input
              value={codigo}
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="000000"
              onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, ''))}
              className="mt-3 w-full rounded-lg border border-tinta-300 px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
            />
            <div className="mt-3 flex justify-center gap-2">
              <Button
                variante="fantasma"
                tamano="sm"
                onClick={() => {
                  setFase('inicial');
                  setCodigo('');
                  setError(null);
                }}
              >
                Reenviar
              </Button>
              <Button
                tamano="sm"
                cargando={verificando}
                disabled={codigo.length < 6}
                onClick={() => void confirmar()}
                iconoIzquierda={<CheckCircle2 className="size-4" aria-hidden />}
              >
                Verificar
              </Button>
            </div>
          </>
        )}

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
