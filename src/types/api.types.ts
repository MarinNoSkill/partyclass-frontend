import type { EstadoReserva } from './dominio.types';

export interface ApiErrorDetalle {
  campo: string;
  mensaje: string;
}

export interface ApiRespuesta<T> {
  success: true;
  data: T;
  meta?: PaginacionMeta;
}

/** Respuesta de listado: `meta` siempre viene. */
export interface ApiRespuestaPaginada<T> {
  success: true;
  data: T[];
  meta: PaginacionMeta;
}

export interface ApiRespuestaError {
  success: false;
  error: {
    codigo: string;
    mensaje: string;
    detalles?: ApiErrorDetalle[];
  };
}

export interface PaginacionMeta {
  pagina: number;
  tamano: number;
  total: number;
  totalPaginas: number;
}

export interface ListaPaginada<T> {
  items: T[];
  meta: PaginacionMeta;
}

export interface UrlFirmada {
  url: string;
  expiraEn: number;
}

export interface FiltrosReservas {
  pagina?: number;
  tamano?: number;
  estado?: EstadoReserva;
  buscar?: string;
  desde?: string;
  hasta?: string;
  orden?: 'created_at' | 'updated_at' | 'codigo';
  direccion?: 'asc' | 'desc';
}
