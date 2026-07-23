import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import type { PaginacionMeta } from '@/types/api.types';

interface PropsPagination {
  meta: PaginacionMeta;
  alCambiarPagina: (pagina: number) => void;
}

export function Pagination({ meta, alCambiarPagina }: PropsPagination) {
  if (meta.totalPaginas <= 1) return null;

  const desde = (meta.pagina - 1) * meta.tamano + 1;
  const hasta = Math.min(meta.pagina * meta.tamano, meta.total);

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col items-center justify-between gap-3 border-t border-tinta-200 px-4 py-3 sm:flex-row sm:px-5"
    >
      <p className="text-sm text-tinta-500">
        Mostrando <span className="font-medium text-tinta-700">{desde}</span>–
        <span className="font-medium text-tinta-700">{hasta}</span> de{' '}
        <span className="font-medium text-tinta-700">{meta.total}</span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          variante="contorno"
          tamano="sm"
          disabled={meta.pagina <= 1}
          onClick={() => alCambiarPagina(meta.pagina - 1)}
          iconoIzquierda={<ChevronLeft className="size-4" aria-hidden />}
        >
          Anterior
        </Button>

        <span className="px-2 text-sm text-tinta-600">
          {meta.pagina} / {meta.totalPaginas}
        </span>

        <Button
          variante="contorno"
          tamano="sm"
          disabled={meta.pagina >= meta.totalPaginas}
          onClick={() => alCambiarPagina(meta.pagina + 1)}
          iconoDerecha={<ChevronRight className="size-4" aria-hidden />}
        >
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
