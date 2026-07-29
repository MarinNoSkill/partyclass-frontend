import { http } from './http';
import type { ApiRespuesta } from '@/types/api.types';
import type { PlanConImagen } from '@/types/planes.types';

export interface RepresentanteAutorizado {
  id: string;
  numero_documento: string;
  nombre: string | null;
  created_at: string;
}

/** Administración del módulo de representantes (requiere JWT admin). */
export const representantesAdminService = {
  /** Plan oculto de representante (para gestionar su convenio). */
  async obtenerPlan(): Promise<PlanConImagen> {
    const { data } = await http.get<ApiRespuesta<PlanConImagen>>('/admin/representantes/plan');
    return data.data;
  },

  async listarAutorizados(): Promise<RepresentanteAutorizado[]> {
    const { data } = await http.get<ApiRespuesta<RepresentanteAutorizado[]>>(
      '/admin/representantes/autorizados',
    );
    return data.data;
  },

  async agregarAutorizados(documentos: string[]): Promise<RepresentanteAutorizado[]> {
    const { data } = await http.post<ApiRespuesta<RepresentanteAutorizado[]>>(
      '/admin/representantes/autorizados',
      { documentos },
    );
    return data.data;
  },

  async eliminarAutorizado(documento: string): Promise<RepresentanteAutorizado[]> {
    const { data } = await http.delete<ApiRespuesta<RepresentanteAutorizado[]>>(
      `/admin/representantes/autorizados/${encodeURIComponent(documento)}`,
    );
    return data.data;
  },
};
