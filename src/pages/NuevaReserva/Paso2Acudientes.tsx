import { CheckCircle2, Trash2, Users } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AcudienteForm } from '@/components/forms/AcudienteForm';
import { StepperNav } from '@/components/stepper/StepperNav';
import { useToast } from '@/contexts/ToastContext';
import type { AcudienteFormulario } from '@/interfaces/formularios';
import type { RolAcudiente } from '@/types/dominio.types';

interface PropsPaso2 {
  acudientes: Partial<Record<RolAcudiente, AcudienteFormulario>>;
  alGuardar: (rol: RolAcudiente, datos: AcudienteFormulario) => void;
  alQuitar: (rol: RolAcudiente) => void;
  alContinuar: () => void;
  alRetroceder: () => void;
}

const ROLES: Array<{ rol: RolAcudiente; etiqueta: string }> = [
  { rol: 'PADRE', etiqueta: 'Padre' },
  { rol: 'MADRE', etiqueta: 'Madre' },
];

/**
 * Paso 2. Cada acudiente se guarda en el estado del navegador, no en la base
 * de datos. El botón «Guardar» se mantiene porque marca el momento en que el
 * formulario se valida: sin esa acción explícita no sabríamos si los datos
 * están completos y correctos.
 */
export function Paso2Acudientes({
  acudientes,
  alGuardar,
  alQuitar,
  alContinuar,
  alRetroceder,
}: PropsPaso2) {
  const { exito } = useToast();
  const alMenosUno = Object.keys(acudientes).length > 0;

  const manejarGuardar = (rol: RolAcudiente, datos: AcudienteFormulario) => {
    alGuardar(rol, datos);
    exito(`Datos ${rol === 'PADRE' ? 'del padre' : 'de la madre'} listos`);
  };

  const manejarQuitar = (rol: RolAcudiente) => {
    alQuitar(rol);
    exito('Acudiente quitado', 'También se descartó su firma, si la tenía.');
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          titulo="Información de los acudientes"
          descripcion="Registra al padre, a la madre o a ambos. Se requiere al menos uno, y cada acudiente registrado deberá firmar."
          icono={<Users className="size-5" aria-hidden />}
        />
      </Card>

      {ROLES.map(({ rol, etiqueta }) => {
        const acudiente = acudientes[rol] ?? null;
        const idFormulario = `formulario-acudiente-${rol.toLowerCase()}`;

        return (
          <Card key={rol} className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-semibold text-tinta-900">{etiqueta}</h3>
                {acudiente ? (
                  <Badge tono="exito">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    Completado
                  </Badge>
                ) : (
                  <Badge tono="neutro">Sin registrar</Badge>
                )}
              </div>

              {acudiente && (
                <Button
                  variante="fantasma"
                  tamano="sm"
                  onClick={() => manejarQuitar(rol)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-700"
                  iconoIzquierda={<Trash2 className="size-4" aria-hidden />}
                >
                  Quitar
                </Button>
              )}
            </div>

            <AcudienteForm
              idFormulario={idFormulario}
              valorInicial={acudiente}
              soloLectura={false}
              alEnviar={(datos) => manejarGuardar(rol, datos)}
            />

            <div className="flex justify-end border-t border-tinta-200 pt-4">
              <Button tamano="sm" variante="contorno" form={idFormulario} type="submit">
                {acudiente ? 'Actualizar datos' : `Guardar ${etiqueta.toLowerCase()}`}
              </Button>
            </div>
          </Card>
        );
      })}

      <Card>
        <StepperNav
          puedeRetroceder
          puedeAvanzar={alMenosUno}
          esUltimoPaso={false}
          alRetroceder={alRetroceder}
          alAvanzar={alContinuar}
          etiquetaAvanzar="Continuar a firmas"
          mensajeBloqueo="Guarda los datos de al menos un acudiente antes de continuar."
        />
      </Card>
    </div>
  );
}
