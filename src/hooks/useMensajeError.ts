import { useCallback } from 'react';
import { ErrorApi } from '@/services/http';
import { useToast } from '@/contexts/ToastContext';

const MENSAJE_GENERICO = 'Ocurrió un error inesperado. Intenta de nuevo.';

/** Extrae un mensaje legible de cualquier error. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi) {
    if (error.detalles.length > 0) {
      return error.detalles.map((detalle) => detalle.mensaje).join(' ');
    }
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return MENSAJE_GENERICO;
}

/** Muestra cualquier error como toast, con título contextual. */
export function useReportarError() {
  const { error: mostrarError } = useToast();

  return useCallback(
    (error: unknown, titulo = 'No se pudo completar la acción') => {
      mostrarError(titulo, mensajeDeError(error));
    },
    [mostrarError],
  );
}
