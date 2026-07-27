import { useQuery } from '@tanstack/react-query';
import { FileWarning, Phone } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { catalogoService } from '@/services/planes.service';

interface Props {
  abierto: boolean;
  alCerrar: () => void;
}

/**
 * Aviso de documento ya diligenciado. Un documento solo puede registrarse una
 * vez; si se intenta de nuevo, se muestra este modal con el número de contacto
 * configurado en el sistema para resolver dudas de información o de plan.
 */
export function ModalDocumentoRegistrado({ abierto, alCerrar }: Props) {
  const contacto = useQuery({
    queryKey: ['contacto-soporte'],
    queryFn: () => catalogoService.contacto(),
    staleTime: 10 * 60_000,
    enabled: abierto,
  });

  const numero = contacto.data?.trim();
  const numeroWhatsApp = numero ? numero.replace(/[^\d+]/g, '') : '';

  return (
    <Modal abierto={abierto} alCerrar={alCerrar} titulo="Este documento ya se diligenció" tamano="sm">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <FileWarning className="size-7" aria-hidden />
        </span>
        <p className="mt-4 text-sm text-tinta-600">
          Este número de documento ya tiene un registro. Solo se permite{' '}
          <strong className="text-tinta-900">un registro por documento</strong>.
        </p>

        {numero && (
          <p className="mt-3 text-sm text-tinta-600">
            Si tienes algún problema con la información o el plan, escribe a este número:
          </p>
        )}
      </div>

      {numero && (
        <a
          href={numeroWhatsApp ? `https://wa.me/${numeroWhatsApp.replace('+', '')}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-oro-200 bg-oro-50 px-4 py-3 font-display text-lg font-bold text-oro-800 transition-colors hover:bg-oro-100"
        >
          <Phone className="size-5" aria-hidden />
          {numero}
        </a>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={alCerrar}>Entendido</Button>
      </div>
    </Modal>
  );
}
