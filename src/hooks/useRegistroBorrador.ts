import { useCallback, useEffect, useState } from 'react';
import type { EstudianteFormulario, AcudienteFormulario } from '@/interfaces/formularios';
import type { PlanConImagen } from '@/types/planes.types';
import type { RolAcudiente } from '@/types/dominio.types';

/** Estado del wizard mientras vive solo en el navegador. */
export interface RegistroEnCurso {
  plan: PlanConImagen | null;
  estudiante: EstudianteFormulario | null;
  acudientes: Partial<Record<RolAcudiente, AcudienteFormulario>>;
  /** Data URLs PNG generadas por el canvas de firma. */
  firmas: Partial<Record<RolAcudiente, string>>;
  /** Teléfonos verificados por SMS. Habilitan la firma de cada acudiente. */
  verificados: Partial<Record<RolAcudiente, boolean>>;
  /**
   * Solicitud de firma remota en curso (los acudientes reciben el enlace por
   * correo). Se invalida si cambian los datos, porque los correos ya se
   * enviaron con la información anterior.
   */
  solicitudId: string | null;
}

const ESTADO_INICIAL: RegistroEnCurso = {
  plan: null,
  estudiante: null,
  acudientes: {},
  firmas: {},
  verificados: {},
  solicitudId: null,
};

const CLAVE = 'partyclass.registro.encurso';

/**
 * Estado del registro en curso.
 *
 * Decisión de negocio: **no hay borradores en el servidor**. Nada llega a la
 * base de datos hasta que el operador finaliza el wizard completo.
 *
 * Se respalda en `sessionStorage` para que un F5 accidental no borre media
 * hora de trabajo, pero nunca en `localStorage`: los datos incluyen firmas y
 * documentos de identidad de menores, y no deben sobrevivir al cierre de la
 * pestaña en un equipo compartido.
 */
export function useRegistroBorrador() {
  const [registro, setRegistro] = useState<RegistroEnCurso>(() => {
    try {
      const guardado = sessionStorage.getItem(CLAVE);
      return guardado ? (JSON.parse(guardado) as RegistroEnCurso) : ESTADO_INICIAL;
    } catch {
      return ESTADO_INICIAL;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(registro));
    } catch {
      // Cuota llena (las firmas pesan): seguimos en memoria. Perder el
      // respaldo es molesto; bloquear el registro sería mucho peor.
    }
  }, [registro]);

  const fijarPlan = useCallback((plan: PlanConImagen) => {
    setRegistro((previo) => ({ ...previo, plan, solicitudId: null }));
  }, []);

  /** Vuelve al selector de plan sin perder lo ya escrito. */
  const limpiarPlan = useCallback(() => {
    setRegistro((previo) => ({ ...previo, plan: null, solicitudId: null }));
  }, []);

  const fijarEstudiante = useCallback((estudiante: EstudianteFormulario) => {
    setRegistro((previo) => ({ ...previo, estudiante, solicitudId: null }));
  }, []);

  const fijarAcudiente = useCallback((rol: RolAcudiente, datos: AcudienteFormulario) => {
    setRegistro((previo) => {
      // Si cambió el email, la verificación anterior deja de valer: el código
      // se envió a otro correo. Se pide verificar el nuevo.
      const cambioEmail = previo.acudientes[rol]?.email !== datos.email;
      const verificados = { ...previo.verificados };
      if (cambioEmail) delete verificados[rol];

      return {
        ...previo,
        acudientes: { ...previo.acudientes, [rol]: datos },
        verificados,
        // Cambiar un acudiente invalida la solicitud de firma ya enviada.
        solicitudId: null,
      };
    });
  }, []);

  const quitarAcudiente = useCallback((rol: RolAcudiente) => {
    setRegistro((previo) => {
      const acudientes = { ...previo.acudientes };
      const firmas = { ...previo.firmas };
      const verificados = { ...previo.verificados };
      delete acudientes[rol];
      // Firma y verificación sin acudiente son datos huérfanos: se van con él.
      delete firmas[rol];
      delete verificados[rol];
      return { ...previo, acudientes, firmas, verificados, solicitudId: null };
    });
  }, []);

  const fijarSolicitud = useCallback((solicitudId: string) => {
    setRegistro((previo) => ({ ...previo, solicitudId }));
  }, []);

  const marcarVerificado = useCallback((rol: RolAcudiente) => {
    setRegistro((previo) => ({
      ...previo,
      verificados: { ...previo.verificados, [rol]: true },
    }));
  }, []);

  const fijarFirma = useCallback((rol: RolAcudiente, imagenBase64: string) => {
    setRegistro((previo) => ({
      ...previo,
      firmas: { ...previo.firmas, [rol]: imagenBase64 },
    }));
  }, []);

  const quitarFirma = useCallback((rol: RolAcudiente) => {
    setRegistro((previo) => {
      const firmas = { ...previo.firmas };
      delete firmas[rol];
      return { ...previo, firmas };
    });
  }, []);

  const limpiar = useCallback(() => {
    sessionStorage.removeItem(CLAVE);
    setRegistro(ESTADO_INICIAL);
  }, []);

  return {
    registro,
    fijarPlan,
    limpiarPlan,
    fijarEstudiante,
    fijarAcudiente,
    quitarAcudiente,
    marcarVerificado,
    fijarFirma,
    quitarFirma,
    fijarSolicitud,
    limpiar,
  };
}
