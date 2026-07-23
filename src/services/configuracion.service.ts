import { http } from './http';
import type { ApiRespuesta } from '@/types/api.types';
import type { ParametroConfiguracion, ResumenDashboard } from '@/types/dominio.types';

export const dashboardService = {
  async resumen(): Promise<ResumenDashboard> {
    const { data } = await http.get<ApiRespuesta<ResumenDashboard>>('/admin/dashboard/resumen');
    return data.data;
  },
};

export const configuracionService = {
  async listar(): Promise<ParametroConfiguracion[]> {
    const { data } = await http.get<ApiRespuesta<ParametroConfiguracion[]>>('/admin/configuracion');
    return data.data;
  },

  async actualizar(
    parametros: Array<{ clave: string; valor: string | null }>,
  ): Promise<ParametroConfiguracion[]> {
    const { data } = await http.put<ApiRespuesta<ParametroConfiguracion[]>>(
      '/admin/configuracion',
      parametros,
    );
    return data.data;
  },
};
