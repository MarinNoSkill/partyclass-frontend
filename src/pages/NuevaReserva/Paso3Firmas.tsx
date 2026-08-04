import { PenTool } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { SignatureCard } from '@/components/signature/SignatureCard';
import { StepperNav } from '@/components/stepper/StepperNav';
import type { AcudienteFormulario } from '@/interfaces/formularios';
import type { RolAcudiente } from '@/types/dominio.types';

interface PropsPaso3 {
  acudientes: Partial<Record<RolAcudiente, AcudienteFormulario>>;
  /** Data URLs PNG por rol, capturadas en el navegador. */
  firmas: Partial<Record<RolAcudiente, string>>;
  /** Teléfonos verificados por SMS, por rol. */
  verificados: Partial<Record<RolAcudiente, boolean>>;
  alFirmar: (rol: RolAcudiente, imagenBase64: string) => void;
  alBorrarFirma: (rol: RolAcudiente) => void;
  alVerificar: (rol: RolAcudiente) => void;
  alContinuar: () => void;
  alRetroceder: () => void;
  /** Permite continuar aunque falten firmas (el registro queda pendiente). */
  permitirSinFirmar?: boolean;
}

const ROLES: RolAcudiente[] = ['PADRE', 'MADRE'];

/**
 * Paso 3. Las firmas se capturan y se conservan en memoria como data URLs;
 * suben a Storage junto con el resto del registro al finalizar.
 *
 * Lo usa el módulo de representantes. El wizard normal de estudiante usa la
 * firma remota por enlace (Paso3FirmaRemota).
 */
export function Paso3Firmas({
  acudientes,
  firmas,
  verificados,
  alFirmar,
  alBorrarFirma,
  alVerificar,
  alContinuar,
  alRetroceder,
  permitirSinFirmar = false,
}: PropsPaso3) {
  const registrados = ROLES.filter((rol) => acudientes[rol]);
  const sinVerificar = registrados.filter((rol) => !verificados[rol]);
  const faltantes = registrados.filter((rol) => !firmas[rol]);
  const todosFirmaron = registrados.length > 0 && faltantes.length === 0;

  const nombreRol = (rol: RolAcudiente) => (rol === 'PADRE' ? 'padre' : 'madre');

  // Con `permitirSinFirmar`, basta tener un acudiente para continuar; lo que
  // falte queda pendiente (convenio con marca «PENDIENTE»).
  const puedeAvanzar = permitirSinFirmar ? registrados.length > 0 : todosFirmaron;

  const mensajeBloqueo =
    registrados.length === 0
      ? 'Debes registrar al menos un acudiente en el paso 2.'
      : permitirSinFirmar
        ? undefined
        : sinVerificar.length > 0
          ? `Falta verificar el correo de: ${sinVerificar.map(nombreRol).join(' y ')}.`
          : `Falta la firma de: ${faltantes.map(nombreRol).join(' y ')}.`;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          titulo="Firmas digitales"
          descripcion="Cada acudiente registrado debe firmar. Puedes limpiar y volver a firmar las veces que necesites."
          icono={<PenTool className="size-5" aria-hidden />}
        />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {ROLES.map((rol) => (
          <SignatureCard
            key={rol}
            rol={rol}
            acudiente={acudientes[rol] ?? null}
            firma={firmas[rol] ?? null}
            verificado={verificados[rol] ?? false}
            alGuardar={(imagenBase64) => alFirmar(rol, imagenBase64)}
            alEliminar={() => alBorrarFirma(rol)}
            alVerificar={() => alVerificar(rol)}
          />
        ))}
      </div>

      {permitirSinFirmar && !todosFirmaron && registrados.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            Puedes continuar sin firmar: el convenio saldrá marcado como{' '}
            <strong>PENDIENTE</strong> hasta que se firme.
          </p>
        </div>
      )}

      <Card>
        <StepperNav
          puedeRetroceder
          puedeAvanzar={puedeAvanzar}
          esUltimoPaso={false}
          alRetroceder={alRetroceder}
          alAvanzar={alContinuar}
          etiquetaAvanzar={
            permitirSinFirmar && !todosFirmaron
              ? 'Continuar (pendiente de firmas)'
              : 'Continuar a confirmación'
          }
          mensajeBloqueo={mensajeBloqueo}
        />
      </Card>
    </div>
  );
}
