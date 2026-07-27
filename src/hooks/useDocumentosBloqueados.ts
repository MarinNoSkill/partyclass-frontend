import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentosBloqueadosService } from '@/services/documentosBloqueados.service';
import type { BloquearDocumentosDto } from '@/types/documentosBloqueados.types';

const CLAVE = ['documentos-bloqueados'] as const;

export function useDocumentosBloqueados() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: () => documentosBloqueadosService.listar(),
    staleTime: 0,
  });
}

export function useBloquearDocumentos() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (datos: BloquearDocumentosDto) => documentosBloqueadosService.bloquear(datos),
    onSuccess: (lista) => cliente.setQueryData(CLAVE, lista),
  });
}

export function useCargarExcelDocumentos() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (vars: { archivo: File; anios: number[] | null }) =>
      documentosBloqueadosService.cargarExcel(vars.archivo, vars.anios),
    onSuccess: (res) => cliente.setQueryData(CLAVE, res.lista),
  });
}

export function useDesbloquearDocumento() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (vars: { documento: string; anio?: number | 'todos' }) =>
      documentosBloqueadosService.desbloquear(vars.documento, vars.anio),
    onSuccess: (lista) => cliente.setQueryData(CLAVE, lista),
  });
}
