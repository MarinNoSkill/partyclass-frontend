import { GraduationCap } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { EstudianteForm } from '@/components/forms/EstudianteForm';
import { StepperNav } from '@/components/stepper/StepperNav';
import type { EstudianteFormulario } from '@/interfaces/formularios';

interface PropsPaso1 {
  estudiante: EstudianteFormulario | null;
  alContinuar: (datos: EstudianteFormulario) => void;
  /** Ausente en las inscripciones por enlace: el plan es fijo, no hay a dónde volver. */
  alRetroceder?: () => void;
  /** Oculta "representante de grupo" (en el módulo de representantes sobra). */
  ocultarRepresentanteGrupo?: boolean;
  /** Fija (prellena y bloquea) el documento del estudiante. */
  documentoFijo?: string;
}

const ID_FORMULARIO = 'formulario-estudiante';

/**
 * Paso 1. No escribe en el servidor: entrega los datos ya validados al
 * orquestador, que los mantiene en el navegador hasta el envío final.
 */
export function Paso1Estudiante({
  estudiante,
  alContinuar,
  alRetroceder,
  ocultarRepresentanteGrupo,
  documentoFijo,
}: PropsPaso1) {
  return (
    <Card className="space-y-6">
      <CardHeader
        titulo="Información del estudiante"
        descripcion="Registra los datos de quien va a participar. Los campos marcados con * son obligatorios."
        icono={<GraduationCap className="size-5" aria-hidden />}
      />

      <EstudianteForm
        idFormulario={ID_FORMULARIO}
        valorInicial={estudiante}
        soloLectura={false}
        alEnviar={alContinuar}
        ocultarRepresentanteGrupo={ocultarRepresentanteGrupo}
        documentoFijo={documentoFijo}
      />

      <StepperNav
        puedeRetroceder={alRetroceder !== undefined}
        puedeAvanzar
        esUltimoPaso={false}
        alRetroceder={alRetroceder ?? (() => undefined)}
        etiquetaRetroceder="Cambiar de plan"
        // Dispara la validación de React Hook Form: si algo falla, no avanza.
        alAvanzar={() => {
          document
            .getElementById(ID_FORMULARIO)
            ?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }}
      />
    </Card>
  );
}
