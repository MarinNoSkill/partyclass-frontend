import { useRef, useState } from 'react';
import { CheckCircle2, RotateCcw, Save, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SignaturePad, type ManejadorSignaturePad } from './SignaturePad';
import { VerificacionEmail } from './VerificacionEmail';
import { useToast } from '@/contexts/ToastContext';
import type { AcudienteFormulario } from '@/interfaces/formularios';
import type { RolAcudiente } from '@/types/dominio.types';

interface PropsSignatureCard {
  rol: RolAcudiente;
  acudiente: AcudienteFormulario | null;
  /** Data URL PNG ya capturada, o `null` si aún no ha firmado. */
  firma: string | null;
  /** `true` cuando el email del acudiente ya se verificó por código. */
  verificado: boolean;
  soloLectura?: boolean;
  alGuardar: (imagenBase64: string) => void;
  alEliminar: () => void;
  alVerificar: () => void;
}

/**
 * Tarjeta de firma de un acudiente: capturar, revisar y volver a firmar.
 *
 * Trabaja íntegramente en el navegador: la firma es un data URL en memoria y
 * no viaja al servidor hasta que se finaliza el registro completo. Por eso ya
 * no pide una signed URL para la vista previa: la propia imagen capturada
 * sirve, y además se ve al instante.
 */
export function SignatureCard({
  rol,
  acudiente,
  firma,
  verificado,
  soloLectura = false,
  alGuardar,
  alEliminar,
  alVerificar,
}: PropsSignatureCard) {
  const padRef = useRef<ManejadorSignaturePad>(null);
  const [tieneTrazo, setTieneTrazo] = useState(false);
  const [reFirmando, setReFirmando] = useState(false);

  const { exito, error: mostrarError } = useToast();

  const mostrarLienzo = !firma || reFirmando;
  const posesivo = rol === 'PADRE' ? 'del padre' : 'de la madre';

  const nombre = acudiente
    ? [
        acudiente.primer_nombre,
        acudiente.segundo_nombre,
        acudiente.primer_apellido,
        acudiente.segundo_apellido,
      ]
        .filter(Boolean)
        .join(' ')
    : null;

  const manejarGuardar = () => {
    const imagen = padRef.current?.exportarPng();

    if (!imagen) {
      mostrarError('Firma vacía', 'Dibuja la firma antes de guardarla.');
      return;
    }

    alGuardar(imagen);
    setReFirmando(false);
    setTieneTrazo(false);
    padRef.current?.limpiar();
    exito(`Firma ${posesivo} guardada`);
  };

  const manejarVolverAFirmar = () => {
    setReFirmando(true);
    setTieneTrazo(false);
    padRef.current?.limpiar();
  };

  const manejarCancelarReFirma = () => {
    setReFirmando(false);
    setTieneTrazo(false);
    padRef.current?.limpiar();
  };

  const manejarEliminar = () => {
    alEliminar();
    setReFirmando(false);
    setTieneTrazo(false);
    padRef.current?.limpiar();
    exito(`Firma ${posesivo} eliminada`);
  };

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-marca-50 text-marca-600">
            <UserRound className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-tinta-900">Firma {posesivo}</h3>
            <p className="mt-0.5 truncate text-sm text-tinta-500">
              {nombre ?? 'Acudiente no registrado'}
            </p>
          </div>
        </div>

        {firma && !reFirmando ? (
          <Badge tono="exito">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Firmado
          </Badge>
        ) : (
          acudiente &&
          verificado && (
            <Badge tono="exito">
              <ShieldCheck className="size-3.5" aria-hidden />
              Correo verificado
            </Badge>
          )
        )}
      </div>

      <div className="mt-5 flex-1">
        {!acudiente ? (
          <div className="grid h-44 place-items-center rounded-xl border-2 border-dashed border-tinta-200 bg-tinta-50 px-4 text-center sm:h-52">
            <p className="text-sm text-tinta-500">
              Registra los datos {posesivo} en el paso 2 para habilitar su firma.
            </p>
          </div>
        ) : !verificado && !soloLectura ? (
          // La firma está bloqueada hasta verificar el correo por código.
          acudiente.email ? (
            <VerificacionEmail
              email={acudiente.email}
              etiqueta={posesivo}
              alVerificar={alVerificar}
            />
          ) : (
            <div className="grid h-44 place-items-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 px-4 text-center sm:h-52">
              <p className="text-sm text-amber-800">
                Agrega el correo {posesivo} en el paso 2 para poder verificar y firmar.
              </p>
            </div>
          )
        ) : mostrarLienzo ? (
          <SignaturePad
            ref={padRef}
            etiqueta={`Firma ${posesivo}`}
            deshabilitado={soloLectura}
            alCambiar={setTieneTrazo}
          />
        ) : (
          <div className="h-44 overflow-hidden rounded-xl border border-tinta-200 bg-white p-4 sm:h-52">
            <img
              src={firma}
              alt={`Firma capturada ${posesivo}`}
              className="mx-auto h-full w-full object-contain"
            />
          </div>
        )}
      </div>

      {!soloLectura && acudiente && verificado && (
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {firma && reFirmando && (
            <Button variante="fantasma" tamano="sm" onClick={manejarCancelarReFirma}>
              Cancelar
            </Button>
          )}

          {firma && !reFirmando && (
            <>
              <Button
                variante="fantasma"
                tamano="sm"
                onClick={manejarEliminar}
                iconoIzquierda={<Trash2 className="size-4" aria-hidden />}
              >
                Eliminar
              </Button>
              <Button
                variante="contorno"
                tamano="sm"
                onClick={manejarVolverAFirmar}
                iconoIzquierda={<RotateCcw className="size-4" aria-hidden />}
              >
                Volver a firmar
              </Button>
            </>
          )}

          {mostrarLienzo && (
            <Button
              tamano="sm"
              onClick={manejarGuardar}
              disabled={!tieneTrazo}
              iconoIzquierda={<Save className="size-4" aria-hidden />}
            >
              Guardar firma
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
