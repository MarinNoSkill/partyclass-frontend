import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileWarning, Loader2, MessageCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { catalogoService } from '@/services/planes.service';

interface Props {
  abierto: boolean;
  alCerrar: () => void;
  /** Título del modal. Por defecto, el aviso de documento. */
  titulo?: string;
  /** Cuerpo del mensaje. Por defecto, el de documento. */
  descripcion?: ReactNode;
}

/**
 * Aviso de dato ya registrado (documento o correo). Un documento o correo solo
 * puede registrarse una vez; si se repite, se muestra este modal con el número
 * de contacto configurado para resolver dudas de información o de plan.
 */
export function ModalDocumentoRegistrado({
  abierto,
  alCerrar,
  titulo = 'Este documento ya se diligenció',
  descripcion,
}: Props) {
  const contacto = useQuery({
    queryKey: ['contacto-soporte'],
    queryFn: () => catalogoService.contacto(),
    staleTime: 10 * 60_000,
    enabled: abierto,
  });

  const numero = contacto.data?.trim() || null;
  const soloDigitos = numero ? numero.replace(/[^\d]/g, '') : '';

  return (
    <Modal abierto={abierto} alCerrar={alCerrar} titulo="Dato ya registrado" tamano="sm">
      <div className="flex flex-col items-center text-center">
        {/* Sello de advertencia */}
        <span className="relative grid size-16 place-items-center">
          <span className="absolute inset-0 rounded-full bg-amber-400/20 blur-md" aria-hidden />
          <span className="relative grid size-16 place-items-center rounded-full bg-linear-to-br from-amber-300 to-amber-500 text-white shadow-[0_8px_20px_-6px_rgb(245_158_11/0.6)]">
            <FileWarning className="size-8" aria-hidden />
          </span>
        </span>

        <h3 className="mt-4 font-display text-lg font-bold text-tinta-900">{titulo}</h3>
        <p className="mt-1.5 text-sm text-tinta-500">
          {descripcion ?? (
            <>
              Solo se permite{' '}
              <strong className="font-semibold text-tinta-700">un registro por documento</strong>.
              Si ya realizaste el tuyo, no necesitas hacerlo de nuevo.
            </>
          )}
        </p>
      </div>

      {/* Contacto de soporte */}
      <div className="mt-5 rounded-2xl border border-oro-200 bg-linear-to-b from-oro-50 to-white p-4 text-center">
        <p className="text-xs font-medium tracking-wide text-tinta-500 uppercase">
          ¿Algún problema con tu información o plan?
        </p>

        {contacto.isPending ? (
          <span className="mt-3 flex items-center justify-center gap-2 text-sm text-tinta-400">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Cargando contacto…
          </span>
        ) : numero ? (
          <>
            <p className="mt-1 text-sm text-tinta-600">Escríbenos a:</p>
            <a
              href={soloDigitos ? `https://wa.me/${soloDigitos}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-linear-to-b from-emerald-500 to-emerald-600 px-4 py-2.5 font-display text-base font-bold text-white shadow-[0_6px_16px_-6px_rgb(16_185_129/0.6)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle className="size-5" aria-hidden />
              {numero}
            </a>
            <p className="mt-2 text-xs text-tinta-400">Toca el botón para escribir por WhatsApp.</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-tinta-500">
            Comunícate con la persona que te compartió el enlace.
          </p>
        )}
      </div>

      <div className="mt-6 flex justify-center">
        <Button variante="secundario" onClick={alCerrar} className="min-w-32">
          Entendido
        </Button>
      </div>
    </Modal>
  );
}
