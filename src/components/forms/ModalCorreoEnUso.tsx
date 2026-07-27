import { AtSign } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface Props {
  abierto: boolean;
  alCerrar: () => void;
}

/**
 * Aviso de correo repetido DENTRO del mismo registro: el correo del estudiante
 * y los de los acudientes deben ser distintos entre sí.
 */
export function ModalCorreoEnUso({ abierto, alCerrar }: Props) {
  return (
    <Modal abierto={abierto} alCerrar={alCerrar} titulo="Correo repetido" tamano="sm">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-linear-to-br from-amber-300 to-amber-500 text-white shadow-[0_8px_20px_-6px_rgb(245_158_11/0.6)]">
          <AtSign className="size-8" aria-hidden />
        </span>
        <h3 className="mt-4 font-display text-lg font-bold text-tinta-900">
          Ese correo ya se está usando
        </h3>
        <p className="mt-1.5 text-sm text-tinta-500">
          El estudiante y cada acudiente deben tener un{' '}
          <strong className="font-semibold text-tinta-700">correo distinto</strong>. Revisa los
          correos y usa uno diferente para cada persona.
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <Button onClick={alCerrar} className="min-w-32">
          Entendido
        </Button>
      </div>
    </Modal>
  );
}
