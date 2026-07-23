import { http } from './http';
import type {
  ApiRespuesta,
  FiltrosReservas,
  ListaPaginada,
  PaginacionMeta,
} from '@/types/api.types';
import type { ReservaResumen } from '@/types/dominio.types';

const META_VACIA: PaginacionMeta = { pagina: 1, tamano: 20, total: 0, totalPaginas: 0 };

/**
 * Consulta de registros ya creados. Vive bajo `/admin` y exige sesión: el alta
 * está en `registro.service.ts` y es lo único que el área operativa necesita.
 */
export const reservasService = {
  async listar(filtros: FiltrosReservas = {}): Promise<ListaPaginada<ReservaResumen>> {
    const { data } = await http.get<ApiRespuesta<ReservaResumen[]>>('/admin/registros', {
      params: filtros,
    });
    return { items: data.data, meta: data.meta ?? META_VACIA };
  },
};
