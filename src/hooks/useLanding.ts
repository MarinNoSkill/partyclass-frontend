import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { landingPublicoService, landingService } from '@/services/landing.service';
import type { SeccionLanding } from '@/types/landing.types';

const clave = ['landing'] as const;

/** Listado admin de todas las imágenes del inicio. */
export function useImagenesLanding() {
  return useQuery({
    queryKey: clave,
    queryFn: () => landingService.listar(),
    staleTime: 0,
  });
}

/** Vista pública del inicio (hero + por año). */
export function useLandingPublico() {
  return useQuery({
    queryKey: ['landing-publico'],
    // Reutiliza las URLs firmadas (válidas 5 min) durante 4 min para que el
    // navegador sirva las imágenes desde caché en vez de re-descargarlas.
    queryFn: () => landingPublicoService.inicio(),
    staleTime: 4 * 60_000,
  });
}

function useInvalidar() {
  const cliente = useQueryClient();
  return () => {
    void cliente.invalidateQueries({ queryKey: clave });
    void cliente.invalidateQueries({ queryKey: ['landing-publico'] });
  };
}

export function useSubirImagenLanding() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (vars: { seccion: SeccionLanding; anio: number | null; archivo: File }) =>
      landingService.subir(vars.seccion, vars.anio, vars.archivo),
    onSuccess: invalidar,
  });
}

export function useAlternarImagenLanding() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (vars: { id: string; activo: boolean }) =>
      landingService.alternarActiva(vars.id, vars.activo),
    onSuccess: invalidar,
  });
}

export function useMoverImagenLanding() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (vars: { id: string; direccion: 'subir' | 'bajar' }) =>
      landingService.mover(vars.id, vars.direccion),
    onSuccess: invalidar,
  });
}

export function useEliminarImagenLanding() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (id: string) => landingService.eliminar(id),
    onSuccess: invalidar,
  });
}
