import { useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  KeyRound,
  ShieldCheck,
  UserRoundCog,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/forms/FormField';
import { EncabezadoSeccion } from '@/components/ui/Decoraciones';
import { Paso1Estudiante } from '@/pages/NuevaReserva/Paso1Estudiante';
import { Paso2Acudientes } from '@/pages/NuevaReserva/Paso2Acudientes';
import { Paso3Firmas } from '@/pages/NuevaReserva/Paso3Firmas';
import { CompanerosTable } from '@/components/representante/CompanerosTable';
import { ModalDocumentoRegistrado } from '@/components/forms/ModalDocumentoRegistrado';
import { ModalCorreoEnUso } from '@/components/forms/ModalCorreoEnUso';
import { StepperNav } from '@/components/stepper/StepperNav';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { ErrorApi } from '@/services/http';
import {
  descargarBlob,
  representanteService,
  type CompaneroInput,
  type RepresentanteCreado,
} from '@/services/representante.service';
import type { EstudianteFormulario, AcudienteFormulario } from '@/interfaces/formularios';
import type { RolAcudiente } from '@/types/dominio.types';

const ROLES: RolAcudiente[] = ['PADRE', 'MADRE'];
const FILAS_INICIALES = 20;
const filaVacia = (): CompaneroInput => ({ nombre: '', whatsapp: '' });

/**
 * Módulo de representantes (`/representante`). Un representante autorizado se
 * registra como estudiante (con firmas de papá y mamá), anexa compañeros y al
 * final descarga su convenio y el Excel de compañeros. Sin plan, número ni OTP.
 */
export function RepresentantePage() {
  const toast = useToast();

  const [fase, setFase] = useState<'gate' | 'form' | 'listo'>('gate');
  const [paso, setPaso] = useState(1);

  // Gate
  const [documento, setDocumento] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [errorGate, setErrorGate] = useState<string | null>(null);

  // Datos del registro
  const [estudiante, setEstudiante] = useState<EstudianteFormulario | null>(null);
  const [acudientes, setAcudientes] = useState<Partial<Record<RolAcudiente, AcudienteFormulario>>>({});
  const [firmas, setFirmas] = useState<Partial<Record<RolAcudiente, string>>>({});
  const [companeros, setCompaneros] = useState<CompaneroInput[]>(
    Array.from({ length: FILAS_INICIALES }, filaVacia),
  );

  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [resultado, setResultado] = useState<RepresentanteCreado | null>(null);

  // Modales de dato duplicado
  const [docDuplicado, setDocDuplicado] = useState(false);
  const [correoRegistrado, setCorreoRegistrado] = useState(false);
  const [correoEnUso, setCorreoEnUso] = useState(false);

  // Firmas: en este módulo no hay OTP → todo verificado.
  const verificados = useMemo(
    () => ({ PADRE: true, MADRE: true }) as Partial<Record<RolAcudiente, boolean>>,
    [],
  );

  const irA = (destino: number) => {
    setPaso(destino);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Gate -----------------------------------------------------------------
  const enviarGate = async (evento: FormEvent) => {
    evento.preventDefault();
    setErrorGate(null);
    const doc = documento.trim();
    if (doc.length < 4) {
      setErrorGate('Ingresa tu número de documento.');
      return;
    }
    setVerificando(true);
    try {
      if (await representanteService.validarDocumento(doc)) {
        setFase('form');
      } else {
        setErrorGate('Este documento no está autorizado como representante.');
      }
    } catch (fallo) {
      setErrorGate(mensajeDeError(fallo));
    } finally {
      setVerificando(false);
    }
  };

  // --- Compañeros -----------------------------------------------------------
  const cambiarCompanero = (i: number, campo: keyof CompaneroInput, valor: string) =>
    setCompaneros((prev) => prev.map((c, idx) => (idx === i ? { ...c, [campo]: valor } : c)));
  const agregarFila = () => setCompaneros((prev) => [...prev, filaVacia()]);
  const quitarFila = (i: number) => setCompaneros((prev) => prev.filter((_, idx) => idx !== i));

  // --- Envío ----------------------------------------------------------------
  const enviar = async () => {
    if (!estudiante) return;
    setErrorEnvio(null);
    setEnviando(true);

    const acudientesRegistrados = ROLES.filter((rol) => acudientes[rol]);
    const companerosLlenos = companeros
      .map((c) => ({ nombre: c.nombre.trim(), whatsapp: c.whatsapp.trim() }))
      .filter((c) => c.nombre && c.whatsapp);

    try {
      const creado = await representanteService.registrar({
        estudiante,
        acudientes: acudientesRegistrados.map((rol) => ({ ...acudientes[rol]!, rol })),
        firmas: acudientesRegistrados.map((rol) => ({ rol, imagenBase64: firmas[rol]! })),
        companeros: companerosLlenos,
      });
      setResultado(creado);
      setFase('listo');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (fallo) {
      if (fallo instanceof ErrorApi) {
        if (fallo.codigo === 'DOCUMENTO_DUPLICADO') return void setDocDuplicado(true);
        if (fallo.codigo === 'CORREO_REGISTRADO') return void setCorreoRegistrado(true);
        if (fallo.codigo === 'CORREO_DUPLICADO') return void setCorreoEnUso(true);
      }
      setErrorEnvio(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  };

  const descargar = async (tipo: 'convenio' | 'excel') => {
    if (!resultado) return;
    try {
      if (tipo === 'convenio') {
        const blob = await representanteService.descargarConvenio(resultado.reservaId);
        descargarBlob(blob, `convenio-${resultado.codigo}.pdf`);
      } else {
        const blob = await representanteService.descargarExcelCompaneros(resultado.reservaId);
        descargarBlob(blob, `companeros-${resultado.codigo}.xlsx`);
      }
    } catch (fallo) {
      toast.error(mensajeDeError(fallo));
    }
  };

  // --- Render ---------------------------------------------------------------

  if (fase === 'gate') {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center">
        <Card className="w-full">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-marca-50 text-marca-600">
              <UserRoundCog className="size-6" aria-hidden />
            </span>
            <h1 className="mt-4 font-display text-lg font-bold text-tinta-900">
              Inscripción de representante
            </h1>
            <p className="mt-1 text-sm text-tinta-500">
              Ingresa tu número de documento para verificar que estás autorizado.
            </p>
          </div>

          <form onSubmit={enviarGate} noValidate className="mt-5 space-y-4">
            <Input
              etiqueta="Número de documento"
              autoFocus
              inputMode="numeric"
              autoComplete="off"
              placeholder="1012345678"
              value={documento}
              onChange={(evento) => setDocumento(evento.target.value)}
              disabled={verificando}
            />
            {errorGate && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {errorGate}
              </p>
            )}
            <Button
              type="submit"
              anchoCompleto
              cargando={verificando}
              iconoIzquierda={<KeyRound className="size-4" aria-hidden />}
            >
              Continuar
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (fase === 'listo' && resultado) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-7" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-tinta-900">
            ¡Registro de representante completado!
          </h1>
          <p className="mt-1 text-sm text-tinta-500">
            Código <strong className="text-tinta-800">{resultado.codigo}</strong>. Descarga tu
            convenio y el Excel de compañeros.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => void descargar('convenio')}
              iconoIzquierda={<Download className="size-4" aria-hidden />}
            >
              Descargar convenio
            </Button>
            <Button
              variante="secundario"
              onClick={() => void descargar('excel')}
              iconoIzquierda={<FileSpreadsheet className="size-4" aria-hidden />}
            >
              Excel de compañeros
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // fase === 'form'
  return (
    <div className="space-y-6">
      <EncabezadoSeccion
        titulo="Inscripción de representante"
        descripcion="Completa tus datos, firma con papá y mamá, y anexa a tus compañeros."
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-marca-200 bg-marca-50 px-4 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-marca-600" aria-hidden />
        <p className="text-sm text-marca-900">
          Registro de <strong>representante</strong>. No lleva plan ni número de sorteo; al final
          descargas tu convenio y el Excel de compañeros.
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
              estudiante={estudiante}
              ocultarRepresentanteGrupo
              alContinuar={(datos) => {
                setEstudiante(datos);
                irA(2);
              }}
            />
          )}

          {paso === 2 && (
            <Paso2Acudientes
              acudientes={acudientes}
              alGuardar={(rol, datos) => setAcudientes((prev) => ({ ...prev, [rol]: datos }))}
              alQuitar={(rol) =>
                setAcudientes((prev) => {
                  const copia = { ...prev };
                  delete copia[rol];
                  return copia;
                })
              }
              alContinuar={() => irA(3)}
              alRetroceder={() => irA(1)}
            />
          )}

          {paso === 3 && (
            <Paso3Firmas
              acudientes={acudientes}
              firmas={firmas}
              verificados={verificados}
              alFirmar={(rol, img) => setFirmas((prev) => ({ ...prev, [rol]: img }))}
              alBorrarFirma={(rol) =>
                setFirmas((prev) => {
                  const copia = { ...prev };
                  delete copia[rol];
                  return copia;
                })
              }
              alVerificar={() => undefined}
              alContinuar={() => irA(4)}
              alRetroceder={() => irA(2)}
            />
          )}

          {paso === 4 && (
            <div className="space-y-5">
              <CompanerosTable
                companeros={companeros}
                alCambiar={cambiarCompanero}
                alAgregarFila={agregarFila}
                alQuitarFila={quitarFila}
              />

              {errorEnvio && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {errorEnvio}
                </p>
              )}

              <Card>
                <StepperNav
                  puedeRetroceder
                  puedeAvanzar
                  esUltimoPaso
                  cargando={enviando}
                  alRetroceder={() => irA(3)}
                  alAvanzar={() => void enviar()}
                  etiquetaAvanzar="Finalizar y generar convenio"
                />
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {paso === 1 && (
        <button
          type="button"
          onClick={() => setFase('gate')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-tinta-500 hover:text-tinta-800"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver a verificar documento
        </button>
      )}

      <ModalDocumentoRegistrado
        abierto={docDuplicado}
        alCerrar={() => setDocDuplicado(false)}
        titulo="Este documento ya se registró"
        descripcion={
          <>Este documento ya está registrado como representante. Solo se permite una vez.</>
        }
      />
      <ModalDocumentoRegistrado
        abierto={correoRegistrado}
        alCerrar={() => setCorreoRegistrado(false)}
        titulo="Este correo ya está registrado"
        descripcion={<>Ese correo ya está en uso en otro registro de representante.</>}
      />
      <ModalCorreoEnUso abierto={correoEnUso} alCerrar={() => setCorreoEnUso(false)} />
    </div>
  );
}
