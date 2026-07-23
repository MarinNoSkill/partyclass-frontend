import { useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PantallaCargando } from '@/components/ui/Spinner';
import { usePlanPorToken } from '@/hooks/usePlanes';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { NuevaReservaPage } from './NuevaReservaPage';

/**
 * Inscripción por enlace personalizado (`/inscripcion/:token`).
 *
 * Resuelve el plan a partir del token y lanza el wizard ya con ese plan fijado,
 * saltándose la selección de año/plan. El colegio abre el enlace y registra
 * directamente sobre el plan que le corresponde.
 */
export function InscripcionPage() {
  const { token } = useParams<{ token: string }>();
  const consulta = usePlanPorToken(token);

  if (consulta.isPending) {
    return <PantallaCargando mensaje="Abriendo el formulario de inscripción…" />;
  }

  if (consulta.isError) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4">
        <Card className="max-w-md text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-tinta-900">Enlace no disponible</h1>
          <p className="mt-2 text-sm text-tinta-500">{mensajeDeError(consulta.error)}</p>
          <p className="mt-1 text-sm text-tinta-400">
            Verifica el enlace con quien te lo compartió.
          </p>
        </Card>
      </div>
    );
  }

  return <NuevaReservaPage planInicial={consulta.data} />;
}
