import { http } from './http';
import type { ApiRespuesta } from '@/types/api.types';
import type { RolAcudiente } from '@/types/dominio.types';
import type { EstudianteFormulario, AcudienteFormulario } from '@/interfaces/formularios';

export interface IniciarFirmaPayload {
  plan_id: string;
  evento?: string | null;
  observaciones?: string | null;
  estudiante: EstudianteFormulario;
  acudientes: Array<AcudienteFormulario & { rol: RolAcudiente }>;
}

export interface FirmanteEstado {
  rol: RolAcudiente;
  emailEnmascarado: string;
  firmado: boolean;
}

export interface SolicitudIniciada {
  solicitudId: string;
  firmantes: Array<{ rol: RolAcudiente; emailEnmascarado: string }>;
}

export interface EstadoSolicitud {
  estado: 'PENDIENTE' | 'FINALIZADA';
  todosFirmaron: boolean;
  firmantes: FirmanteEstado[];
}

export interface ContextoFirma {
  estudianteNombre: string;
  acudienteNombre: string;
  rol: RolAcudiente;
  planNombre: string;
  yaFirmado: boolean;
  expirado: boolean;
  finalizado: boolean;
}

export interface RegistroFinalizado {
  id: string;
  codigo: string;
  numerosConvenio: string[];
  contratoId: string;
}

export const firmaRemotaService = {
  /** Crea la solicitud y dispara los correos de firma a los acudientes. */
  async iniciar(payload: IniciarFirmaPayload): Promise<SolicitudIniciada> {
    const { data } = await http.post<ApiRespuesta<SolicitudIniciada>>('/firma-remota', payload);
    return data.data;
  },

  /** Estado de las firmas (se consulta en bucle mientras se espera). */
  async estado(solicitudId: string): Promise<EstadoSolicitud> {
    const { data } = await http.get<ApiRespuesta<EstadoSolicitud>>(
      `/firma-remota/${solicitudId}/estado`,
    );
    return data.data;
  },

  /** Con todas las firmas listas, crea el registro y devuelve el convenio. */
  async finalizar(solicitudId: string): Promise<RegistroFinalizado> {
    const { data } = await http.post<ApiRespuesta<RegistroFinalizado>>(
      `/firma-remota/${solicitudId}/finalizar`,
    );
    return data.data;
  },

  // --- Página pública de firma (la abre el acudiente desde el correo) --------

  async contexto(token: string): Promise<ContextoFirma> {
    const { data } = await http.get<ApiRespuesta<ContextoFirma>>(`/firma-remota/token/${token}`);
    return data.data;
  },

  async firmar(token: string, imagenBase64: string): Promise<void> {
    await http.post(`/firma-remota/token/${token}/firmar`, { imagenBase64 });
  },
};
