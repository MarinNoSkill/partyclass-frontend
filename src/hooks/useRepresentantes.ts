import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { representantesAdminService } from '@/services/representantesAdmin.service';
import { planesService } from '@/services/planes.service';

const CLAVE_AUTORIZADOS = ['representantes', 'autorizados'] as const;
const CLAVE_PLAN = ['representantes', 'plan'] as const;

export function usePlanRepresentante() {
  return useQuery({
    queryKey: CLAVE_PLAN,
    queryFn: () => representantesAdminService.obtenerPlan(),
    staleTime: 0,
  });
}

export function useAutorizadosRepresentante() {
  return useQuery({
    queryKey: CLAVE_AUTORIZADOS,
    queryFn: () => representantesAdminService.listarAutorizados(),
    staleTime: 0,
  });
}

export function useAgregarAutorizados() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (documentos: string[]) => representantesAdminService.agregarAutorizados(documentos),
    onSuccess: (lista) => cliente.setQueryData(CLAVE_AUTORIZADOS, lista),
  });
}

export function useEliminarAutorizado() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (documento: string) => representantesAdminService.eliminarAutorizado(documento),
    onSuccess: (lista) => cliente.setQueryData(CLAVE_AUTORIZADOS, lista),
  });
}

/** Sube/cambia la imagen del convenio de representante (reusa el endpoint de plantilla). */
export function useSubirConvenioRepresentante() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archivo }: { id: string; archivo: File }) =>
      planesService.subirPlantilla(id, archivo),
    onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVE_PLAN }),
  });
}
