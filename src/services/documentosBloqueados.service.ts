import { http } from './http';
import type { ApiRespuesta } from '@/types/api.types';
import type {
  BloquearDocumentosDto,
  DocumentoBloqueadoAgrupado,
} from '@/types/documentosBloqueados.types';

/** Gestión de documentos bloqueados (requiere JWT de administrador). */
export const documentosBloqueadosService = {
  async listar(): Promise<DocumentoBloqueadoAgrupado[]> {
    const { data } = await http.get<ApiRespuesta<DocumentoBloqueadoAgrupado[]>>(
      '/admin/documentos-bloqueados',
    );
    return data.data;
  },

  async bloquear(datos: BloquearDocumentosDto): Promise<DocumentoBloqueadoAgrupado[]> {
    const { data } = await http.post<ApiRespuesta<DocumentoBloqueadoAgrupado[]>>(
      '/admin/documentos-bloqueados',
      datos,
    );
    return data.data;
  },

  /** Quita el bloqueo. Sin `anio` = todos; con año = solo ese; 'todos' = fila «todos los años». */
  async desbloquear(
    documento: string,
    anio?: number | 'todos',
  ): Promise<DocumentoBloqueadoAgrupado[]> {
    const params = anio !== undefined ? { anio: String(anio) } : undefined;
    const { data } = await http.delete<ApiRespuesta<DocumentoBloqueadoAgrupado[]>>(
      `/admin/documentos-bloqueados/${encodeURIComponent(documento)}`,
      { params },
    );
    return data.data;
  },
};
