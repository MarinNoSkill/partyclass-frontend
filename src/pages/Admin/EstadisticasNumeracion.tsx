import { BadgeCheck, Hash, Lock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { EstadisticasNumeracion } from '@/types/numeracion.types';

interface Props {
  datos: EstadisticasNumeracion | undefined;
  cargando: boolean;
}

/** Resumen del consumo del pool de numeración. */
export function EstadisticasNumeracionPanel({ datos, cargando }: Props) {
  if (cargando || !datos) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((indice) => (
          <Card key={indice}>
            <div className="h-16 animate-pulse rounded-lg bg-tinta-100" />
          </Card>
        ))}
      </div>
    );
  }

  const tarjetas = [
    {
      etiqueta: 'Números disponibles',
      valor: datos.disponibles.toLocaleString('es-CO'),
      pie: `de ${datos.total.toLocaleString('es-CO')} en total`,
      icono: BadgeCheck,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      etiqueta: 'Convenios asignados',
      valor: datos.asignados.toLocaleString('es-CO'),
      pie: 'nunca se reutilizan',
      icono: Hash,
      color: 'text-marca-600 bg-marca-50',
    },
    {
      etiqueta: 'Números bloqueados',
      valor: datos.bloqueados.toLocaleString('es-CO'),
      pie: 'no se asignan',
      icono: Lock,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      etiqueta: 'Uso del pool',
      valor: `${datos.porcentajeUso}%`,
      pie: datos.porcentajeUso >= 90 ? 'Pool casi agotado' : 'Dentro de lo normal',
      icono: TrendingUp,
      color:
        datos.porcentajeUso >= 90
          ? 'text-red-600 bg-red-50'
          : 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tarjetas.map((tarjeta) => (
        <Card key={tarjeta.etiqueta}>
          <div className="flex items-start gap-3">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tarjeta.color}`}>
              <tarjeta.icono className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-tinta-500">{tarjeta.etiqueta}</p>
              <p className="mt-0.5 text-2xl font-semibold text-tinta-900">
                {tarjeta.valor}
              </p>
              <p className="mt-0.5 truncate text-xs text-tinta-400">{tarjeta.pie}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
