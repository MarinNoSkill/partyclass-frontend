import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { numeracionService } from '@/services/numeracion.service';
import { registroService } from '@/services/registro.service';
import { auditoriaService } from '@/services/auth.service';
import type { FiltrosNumeracion } from '@/types/numeracion.types';

export const clavesNumeracion = {
  raiz: ['numeracion'] as const,
  lista: (filtros: FiltrosNumeracion) => ['numeracion', 'lista', filtros] as const,
  estadisticas: () => ['numeracion', 'estadisticas'] as const,
  planes: () => ['numeracion', 'planes'] as const,
};

export function useNumeracion(filtros: FiltrosNumeracion) {
  return useQuery({
    queryKey: clavesNumeracion.lista(filtros),
    queryFn: () => numeracionService.listar(filtros),
    // Mantiene la página anterior visible mientras carga la siguiente:
    // evita que la tabla parpadee a vacío al paginar o filtrar.
    placeholderData: keepPreviousData,
  });
}

export function useEstadisticasNumeracion() {
  return useQuery({
    queryKey: clavesNumeracion.estadisticas(),
    queryFn: () => numeracionService.estadisticas(),
  });
}

export function usePlanes() {
  return useQuery({
    queryKey: clavesNumeracion.planes(),
    queryFn: () => numeracionService.planes(),
    staleTime: 10 * 60_000,
  });
}

/** Sube el Excel de abonados y obtiene los números asignados que faltan en él. */
export function useConciliarAbonos() {
  return useMutation({
    mutationFn: (archivo: File) => numeracionService.conciliar(archivo),
  });
}

/** Bloquea o desbloquea números (no podrán asignarse). */
export function useFijarBloqueoNumeros() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (vars: { numeros: string[]; bloqueado: boolean }) =>
      numeracionService.fijarBloqueo(vars.numeros, vars.bloqueado),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: clavesNumeracion.raiz });
    },
  });
}

/**
 * Desasigna un número borrando su reserva completa (y liberando todos sus
 * números). Invalida numeración y registros para que las vistas se refresquen.
 */
export function useDesasignarReserva() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (reservaId: string) => registroService.eliminar(reservaId),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: clavesNumeracion.raiz });
      void cliente.invalidateQueries({ queryKey: ['registros'] });
    },
  });
}

export function useAuditoriaReserva(reservaId: string | undefined) {
  return useQuery({
    queryKey: ['auditoria', reservaId],
    queryFn: () => auditoriaService.detalle(reservaId as string),
    enabled: Boolean(reservaId),
    // Las URLs firmadas caducan a los 5 min: no conviene servirlas de caché.
    staleTime: 0,
    gcTime: 60_000,
  });
}
