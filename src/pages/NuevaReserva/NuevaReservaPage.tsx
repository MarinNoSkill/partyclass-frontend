import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PASOS_RESERVA, Stepper } from '@/components/stepper/Stepper';
import { Paso1Estudiante } from './Paso1Estudiante';
import { Paso2Acudientes } from './Paso2Acudientes';
import { Paso3Firmas } from './Paso3Firmas';
import { Paso4Confirmacion } from './Paso4Confirmacion';
import { SeleccionPlan } from './SeleccionPlan';
import { RegistroListo } from './RegistroListo';
import { ModalDocumentoRegistrado } from '@/components/forms/ModalDocumentoRegistrado';
import { useRegistroBorrador } from '@/hooks/useRegistroBorrador';
import { catalogoService } from '@/services/planes.service';
import type { EstudianteFormulario } from '@/interfaces/formularios';
import type { PlanConImagen } from '@/types/planes.types';
import type { RegistroCreado } from '@/services/registro.service';

const PASO_MINIMO = 1;
const PASO_MAXIMO = 4;

interface Props {
  /** Cuando viene de un enlace de inscripción: el plan ya está decidido. */
  planInicial?: PlanConImagen;
}

/**
 * Orquestador del wizard de 4 pasos.
 *
 * Decisión de negocio: **no hay borradores en el servidor**. Todo el registro
 * vive en el navegador (`useRegistroBorrador`, respaldado en sessionStorage) y
 * solo se envía al confirmar el paso 4. Hasta ese momento no existe ninguna
 * fila en la base de datos, ningún archivo en Storage, y no se consume ningún
 * número de sorteo.
 *
 * A cambio, este componente es la única fuente de verdad mientras dura el
 * proceso: los pasos no escriben nada, solo devuelven datos ya validados.
 */
export function NuevaReservaPage({ planInicial }: Props = {}) {
  const [paso, setPaso] = useState(PASO_MINIMO);
  const [pasoMaximoAlcanzado, setPasoMaximoAlcanzado] = useState(PASO_MINIMO);
  const [resultado, setResultado] = useState<RegistroCreado | null>(null);
  const [documentoDuplicado, setDocumentoDuplicado] = useState(false);

  const {
    registro,
    fijarPlan,
    limpiarPlan,
    fijarEstudiante,
    fijarAcudiente,
    quitarAcudiente,
    marcarVerificado,
    fijarFirma,
    quitarFirma,
    limpiar,
  } = useRegistroBorrador();

  // Enlace de inscripción: fija el plan del enlace la primera vez, aunque en
  // sessionStorage hubiera un borrador con otro plan (el enlace manda).
  const tokenFijado = useRef<string | null>(null);
  useEffect(() => {
    if (!planInicial || tokenFijado.current === planInicial.id) return;
    tokenFijado.current = planInicial.id;
    fijarPlan(planInicial);
    setPaso(PASO_MINIMO);
    setPasoMaximoAlcanzado(PASO_MINIMO);
  }, [planInicial, fijarPlan]);

  const irAPaso = useCallback((destino: number) => {
    const objetivo = Math.min(Math.max(destino, PASO_MINIMO), PASO_MAXIMO);
    setPaso(objetivo);
    setPasoMaximoAlcanzado((maximo) => Math.max(maximo, objetivo));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const avanzar = useCallback(() => irAPaso(paso + 1), [irAPaso, paso]);
  const retroceder = useCallback(() => irAPaso(paso - 1), [irAPaso, paso]);

  /** Volver al selector de plan. Conserva los datos ya escritos. */
  const volverASeleccionPlan = useCallback(() => {
    limpiarPlan();
    setPaso(PASO_MINIMO);
    setPasoMaximoAlcanzado(PASO_MINIMO);
  }, [limpiarPlan]);

  const guardarEstudiante = useCallback(
    async (datos: EstudianteFormulario) => {
      // Un documento solo puede registrarse una vez. Se avisa cuanto antes;
      // el backend lo vuelve a verificar al crear (fuente de verdad).
      try {
        if (await catalogoService.documentoRegistrado(datos.numero_documento)) {
          setDocumentoDuplicado(true);
          return;
        }
      } catch {
        // Si el chequeo falla (red), no se bloquea: el backend decidirá al crear.
      }
      fijarEstudiante(datos);
      irAPaso(2);
    },
    [fijarEstudiante, irAPaso],
  );

  /**
   * El resultado se guarda AQUÍ, no dentro del paso 4.
   *
   * Al crear el registro se limpia el wizard, y eso deja `registro.plan` en
   * null. Si la pantalla de éxito viviera dentro del paso, el propio padre la
   * desmontaría en ese mismo render y el operador acabaría de vuelta en la
   * selección de plan sin ver el número que le tocó. Por eso se comprueba
   * antes que ninguna otra cosa.
   */
  if (resultado) {
    return (
      <RegistroListo
        resultado={resultado}
        alNuevoRegistro={() => {
          setResultado(null);
          setPaso(PASO_MINIMO);
          setPasoMaximoAlcanzado(PASO_MINIMO);
        }}
      />
    );
  }

  // Sin plan no hay convenio que rellenar. En un enlace de inscripción el plan
  // llega por props y se fija en el efecto de arriba: mientras tanto, y siempre
  // para ese caso, no se muestra el selector.
  if (!registro.plan) {
    if (planInicial) return null;
    return (
      <SeleccionPlan
        alConfirmar={(plan) => {
          fijarPlan(plan);
          irAPaso(PASO_MINIMO);
        }}
        creando={false}
        error={null}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <Stepper
          pasos={PASOS_RESERVA}
          pasoActual={paso}
          pasoMaximoAlcanzado={pasoMaximoAlcanzado}
          alSeleccionar={irAPaso}
        />
      </Card>

      <div className="flex items-start gap-2.5 rounded-xl border border-marca-200 bg-marca-50 px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-marca-600" aria-hidden />
        <p className="text-sm text-marca-900">
          <strong>{registro.plan.nombre}</strong> · {registro.plan.anio}. El registro se
          guardará al finalizar el último paso; hasta entonces nada se envía al servidor.
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={paso}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {paso === 1 && (
            <Paso1Estudiante
              estudiante={registro.estudiante}
              alContinuar={guardarEstudiante}
              alRetroceder={planInicial ? undefined : volverASeleccionPlan}
            />
          )}

          {paso === 2 && (
            <Paso2Acudientes
              acudientes={registro.acudientes}
              alGuardar={fijarAcudiente}
              alQuitar={quitarAcudiente}
              alContinuar={avanzar}
              alRetroceder={retroceder}
            />
          )}

          {paso === 3 && (
            <Paso3Firmas
              acudientes={registro.acudientes}
              firmas={registro.firmas}
              verificados={registro.verificados}
              alFirmar={fijarFirma}
              alBorrarFirma={quitarFirma}
              alVerificar={marcarVerificado}
              alContinuar={avanzar}
              alRetroceder={retroceder}
            />
          )}

          {paso === 4 && (
            <Paso4Confirmacion
              registro={registro}
              alRetroceder={retroceder}
              // Solo se limpia tras un alta correcta: si falla, el operador
              // conserva todo lo que había escrito.
              alRegistrar={(creado) => {
                setResultado(creado);
                limpiar();
              }}
              alDocumentoDuplicado={() => setDocumentoDuplicado(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <ModalDocumentoRegistrado
        abierto={documentoDuplicado}
        alCerrar={() => setDocumentoDuplicado(false)}
      />
    </div>
  );
}
