import { http } from './http';
import type { ApiRespuesta, ApiRespuestaPaginada } from '@/types/api.types';
import type {
  ConciliacionResultado,
  EstadisticasNumeracion,
  FiltrosNumeracion,
  NumeracionVista,
  Plan,
} from '@/types/numeracion.types';

/** Convierte los filtros en query params, omitiendo los vacíos. */
function aParams(filtros: FiltrosNumeracion): Record<string, string | number> {
  const params: Record<string, string | number> = {
    pagina: filtros.pagina,
    tamano: filtros.tamano,
  };

  if (filtros.estado) params.estado = filtros.estado;
  if (filtros.numero) params.numero = filtros.numero;
  if (filtros.anio !== undefined) params.anio = filtros.anio;
  if (filtros.planId) params.planId = filtros.planId;
  if (filtros.desde) params.desde = filtros.desde;
  if (filtros.hasta) params.hasta = filtros.hasta;
  if (filtros.buscar) params.buscar = filtros.buscar;

  return params;
}

/**
 * Cliente del módulo Control de Numeración.
 *
 * Solo expone lecturas. El frontend no conoce —ni puede influir en— cómo se
 * eligen los números: eso ocurre íntegramente en la base de datos.
 */
export const numeracionService = {
  async listar(filtros: FiltrosNumeracion): Promise<ApiRespuestaPaginada<NumeracionVista>> {
    const { data } = await http.get<ApiRespuestaPaginada<NumeracionVista>>(
      '/admin/numeracion',
      { params: aParams(filtros) },
    );
    return data;
  },

  async buscarPorNumero(numero: string): Promise<NumeracionVista> {
    const { data } = await http.get<ApiRespuesta<NumeracionVista>>(
      `/admin/numeracion/${numero}`,
    );
    return data.data;
  },

  async estadisticas(): Promise<EstadisticasNumeracion> {
    const { data } = await http.get<ApiRespuesta<EstadisticasNumeracion>>(
      '/admin/numeracion/estadisticas',
    );
    return data.data;
  },

  async planes(): Promise<Plan[]> {
    const { data } = await http.get<ApiRespuesta<Plan[]>>('/admin/numeracion/planes');
    return data.data;
  },

  /**
   * Sube el Excel de abonados y devuelve los números asignados que NO están en
   * él (candidatos a desasignar).
   */
  async conciliar(archivo: File): Promise<ConciliacionResultado> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);

    const { data } = await http.post<ApiRespuesta<ConciliacionResultado>>(
      '/admin/numeracion/conciliar',
      formulario,
      { headers: { 'Content-Type': undefined } },
    );
    return data.data;
  },

  /** Bloquea o desbloquea números para que no se asignen. */
  async fijarBloqueo(numeros: string[], bloqueado: boolean): Promise<{ afectados: number }> {
    const { data } = await http.post<ApiRespuesta<{ afectados: number }>>(
      '/admin/numeracion/bloqueo',
      { numeros, bloqueado },
    );
    return data.data;
  },
};
