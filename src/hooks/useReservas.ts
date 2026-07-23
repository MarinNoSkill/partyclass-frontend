import { useQuery } from '@tanstack/react-query';
import { reservasService } from '@/services/reservas.service';
import { dashboardService } from '@/services/configuracion.service';
import type { FiltrosReservas } from '@/types/api.types';

/** Claves de caché centralizadas: evita invalidaciones con strings sueltos. */
export const clavesQuery = {
  reservas: ['reservas'] as const,
  listaReservas: (filtros: FiltrosReservas) => ['reservas', 'lista', filtros] as const,
  dashboard: ['dashboard'] as const,
} as const;

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

export function useListaReservas(filtros: FiltrosReservas) {
  return useQuery({
    queryKey: clavesQuery.listaReservas(filtros),
    queryFn: () => reservasService.listar(filtros),
    placeholderData: (anterior) => anterior,
  });
}

export function useResumenDashboard() {
  return useQuery({
    queryKey: clavesQuery.dashboard,
    queryFn: () => dashboardService.resumen(),
  });
}


