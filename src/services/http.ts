import axios, { AxiosError, type AxiosInstance } from 'axios';
import { config } from '@/utils/config';
import type { ApiErrorDetalle, ApiRespuesta, ApiRespuestaError } from '@/types/api.types';

/** Error normalizado de la API. Todo el frontend trabaja con esta forma. */
export class ErrorApi extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
    public readonly status: number,
    public readonly detalles: ApiErrorDetalle[] = [],
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }

  get esValidacion(): boolean {
    return this.codigo === 'VALIDACION';
  }

  get esNoEncontrado(): boolean {
    return this.codigo === 'NO_ENCONTRADO';
  }

  get esReglaNegocio(): boolean {
    return this.codigo === 'REGLA_NEGOCIO';
  }
}

export const http: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey,
  },
});

/**
 * Token JWT del administrador.
 *
 * Se guarda en un módulo, no en el contexto de React, porque el interceptor
 * de Axios se ejecuta fuera del árbol de componentes. AuthContext es el único
 * que debe llamar a `establecerToken`.
 */
let tokenAdmin: string | null = null;

export function establecerToken(token: string | null): void {
  tokenAdmin = token;
}

/** Se invoca cuando el servidor rechaza el token: permite cerrar la sesión. */
let alExpirarSesion: (() => void) | null = null;

export function registrarManejadorSesionExpirada(manejador: (() => void) | null): void {
  alExpirarSesion = manejador;
}

http.interceptors.request.use((peticion) => {
  if (tokenAdmin) {
    peticion.headers.set('Authorization', `Bearer ${tokenAdmin}`);
  }
  return peticion;
});

/**
 * Interceptor único de errores: convierte cualquier fallo (red, timeout,
 * respuesta de la API) en un ErrorApi. Ningún componente ve un AxiosError.
 */
http.interceptors.response.use(
  (respuesta) => respuesta,
  (error: AxiosError<ApiRespuestaError>) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new ErrorApi('TIMEOUT', 'La petición tardó demasiado. Intenta de nuevo.', 0),
      );
    }

    if (!error.response) {
      return Promise.reject(
        new ErrorApi(
          'SIN_CONEXION',
          'No se pudo conectar con el servidor. Revisa tu conexión.',
          0,
        ),
      );
    }

    const { status, data } = error.response;

    // Token caducado o inválido en una ruta de admin: cerramos la sesión local
    // para que la UI redirija al login en lugar de fallar en bucle.
    const esRutaAdmin = error.config?.url?.includes('/admin/') ?? false;
    if (status === 401 && esRutaAdmin && tokenAdmin) {
      alExpirarSesion?.();
    }

    if (data && typeof data === 'object' && 'error' in data && data.error) {
      return Promise.reject(
        new ErrorApi(data.error.codigo, data.error.mensaje, status, data.error.detalles ?? []),
      );
    }

    return Promise.reject(
      new ErrorApi('ERROR_INTERNO', 'Ocurrió un error inesperado en el servidor.', status),
    );
  },
);

/** Desempaqueta `{ success, data }` para que los servicios devuelvan T directo. */
export function extraerDatos<T>(cuerpo: ApiRespuesta<T>): T {
  return cuerpo.data;
}
