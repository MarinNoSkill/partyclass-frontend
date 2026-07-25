import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogoService, planesService } from '@/services/planes.service';
import type { ActualizarPlanDto, CrearPlanDto, FiltrosPlanes } from '@/types/planes.types';

export const clavesPlanes = {
  raiz: ['planes'] as const,
  lista: (filtros: FiltrosPlanes) => ['planes', 'lista', filtros] as const,
  detalle: (id: string) => ['planes', 'detalle', id] as const,
  anios: () => ['catalogo', 'anios'] as const,
  delAnio: (anio: number) => ['catalogo', 'planes', anio] as const,
};

export function usePlanesAdmin(filtros: FiltrosPlanes = {}) {
  return useQuery({
    queryKey: clavesPlanes.lista(filtros),
    queryFn: () => planesService.listar(filtros),
    // Las URLs de plantilla son firmadas y caducan: no conviene cachearlas.
    staleTime: 0,
  });
}

export function useAniosDisponibles() {
  return useQuery({
    queryKey: clavesPlanes.anios(),
    queryFn: () => catalogoService.anios(),
    staleTime: 5 * 60_000,
  });
}

export function usePlanesDelAnio(anio: number | null) {
  return useQuery({
    queryKey: clavesPlanes.delAnio(anio ?? 0),
    queryFn: () => catalogoService.planesDelAnio(anio as number),
    enabled: anio !== null,
    staleTime: 0,
  });
}

export function usePlanPorToken(token: string | undefined) {
  return useQuery({
    queryKey: ['catalogo', 'plan-token', token],
    queryFn: () => catalogoService.planPorToken(token as string),
    enabled: Boolean(token),
    staleTime: 0,
    retry: false,
  });
}

/** Invalida todo el árbol de planes tras cualquier escritura. */
function useInvalidarPlanes() {
  const cliente = useQueryClient();
  return () => {
    void cliente.invalidateQueries({ queryKey: clavesPlanes.raiz });
    void cliente.invalidateQueries({ queryKey: ['catalogo'] });
  };
}

export function useCrearPlan() {
  const invalidar = useInvalidarPlanes();
  return useMutation({
    mutationFn: (datos: CrearPlanDto) => planesService.crear(datos),
    onSuccess: invalidar,
  });
}

export function useActualizarPlan() {
  const invalidar = useInvalidarPlanes();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ActualizarPlanDto }) =>
      planesService.actualizar(id, datos),
    onSuccess: invalidar,
  });
}

export function useEliminarPlan() {
  const invalidar = useInvalidarPlanes();
  return useMutation({
    mutationFn: (id: string) => planesService.eliminar(id),
    onSuccess: invalidar,
  });
}

export function useSubirPlantilla() {
  const invalidar = useInvalidarPlanes();
  return useMutation({
    mutationFn: ({ id, archivo }: { id: string; archivo: File }) =>
      planesService.subirPlantilla(id, archivo),
    onSuccess: invalidar,
  });
}

export function useEliminarPlantilla() {
  const invalidar = useInvalidarPlanes();
  return useMutation({
    mutationFn: (id: string) => planesService.eliminarPlantilla(id),
    onSuccess: invalidar,
  });
}

export function useSubirBoleta() {
  const invalidar = useInvalidarPlanes();
  return useMutation({
    mutationFn: ({ id, archivo }: { id: string; archivo: File }) =>
      planesService.subirBoleta(id, archivo),
    onSuccess: invalidar,
  });
}

export function useEliminarBoleta() {
  const invalidar = useInvalidarPlanes();
  return useMutation({
    mutationFn: (id: string) => planesService.eliminarBoleta(id),
    onSuccess: invalidar,
  });
}

export function useSubirPresentacion() {
  const invalidar = useInvalidarPlanes();
  return useMutation({
    mutationFn: ({ id, archivo }: { id: string; archivo: File }) =>
      planesService.subirPresentacion(id, archivo),
    onSuccess: invalidar,
  });
}

export function useEliminarPresentacion() {
  const invalidar = useInvalidarPlanes();
  return useMutation({
    mutationFn: (id: string) => planesService.eliminarPresentacion(id),
    onSuccess: invalidar,
  });
}
