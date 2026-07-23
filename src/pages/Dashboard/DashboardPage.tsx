import { Link } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  FileClock,
  Inbox,
  Plus,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { BadgeEstado } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PantallaCargando } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { useResumenDashboard } from '@/hooks/useReservas';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { formatearFecha } from '@/utils/formato';

interface PropsTarjetaMetrica {
  etiqueta: string;
  valor: number | string;
  icono: LucideIcon;
  detalle?: string;
  tono?: 'marca' | 'exito' | 'alerta' | 'neutro';
}

const TONOS = {
  marca: 'bg-marca-50 text-marca-600',
  exito: 'bg-emerald-50 text-emerald-600',
  alerta: 'bg-amber-50 text-amber-600',
  neutro: 'bg-tinta-100 text-tinta-500',
} as const;

function TarjetaMetrica({
  etiqueta,
  valor,
  icono: Icono,
  detalle,
  tono = 'neutro',
}: PropsTarjetaMetrica) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-tinta-500">{etiqueta}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-tinta-900">{valor}</p>
          {detalle && <p className="mt-1 text-xs text-tinta-400">{detalle}</p>}
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${TONOS[tono]}`}>
          <Icono className="size-5" aria-hidden />
        </span>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, error } = useResumenDashboard();

  if (isLoading) return <PantallaCargando mensaje="Cargando indicadores…" />;

  if (isError || !data) {
    return (
      <Card>
        <EmptyState
          icono={<Inbox className="size-6" aria-hidden />}
          titulo="No se pudieron cargar los indicadores"
          descripcion={mensajeDeError(error)}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetrica
          etiqueta="Total de reservas"
          valor={data.totales.todas}
          icono={Inbox}
          tono="marca"
        />
        <TarjetaMetrica
          etiqueta="Completadas"
          valor={data.totales.completadas}
          icono={CheckCircle2}
          detalle={`${data.tasaCompletitud}% de completitud`}
          tono="exito"
        />
        <TarjetaMetrica
          etiqueta="En borrador"
          valor={data.totales.borradores}
          icono={FileClock}
          detalle="Pendientes de finalizar"
          tono="alerta"
        />
        <TarjetaMetrica
          etiqueta="Últimos 30 días"
          valor={data.ultimos30Dias}
          icono={TrendingUp}
          detalle={`${data.ultimos7Dias} en los últimos 7 días`}
          tono="neutro"
        />
      </div>

      <Card sinRelleno>
        <div className="p-5 sm:p-6">
          <CardHeader
            titulo="Registros recientes"
            descripcion="Los últimos cinco registros creados."
            icono={<CalendarClock className="size-5" aria-hidden />}
            acciones={
              <Link
                to="/admin/registros"
                className="text-sm font-medium text-marca-600 hover:text-marca-700"
              >
                Ver todas
              </Link>
            }
          />
        </div>

        {data.recientes.length === 0 ? (
          <EmptyState
            icono={<Inbox className="size-6" aria-hidden />}
            titulo="Todavía no hay registros"
            descripcion="Crea el primer registro para empezar a ver información aquí."
            accion={
              <Link to="/">
                <Button iconoIzquierda={<Plus className="size-4" aria-hidden />}>
                  Ir al registro
                </Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-tinta-100 border-t border-tinta-100">
            {data.recientes.map((reserva) => (
              <li key={reserva.id}>
                <Link
                  to={`/admin/registros/${reserva.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-tinta-50 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-tinta-900">
                      {reserva.estudiante_nombre || 'Sin estudiante registrado'}
                    </p>
                    <p className="mt-0.5 text-xs text-tinta-400">
                      {reserva.codigo} · {formatearFecha(reserva.created_at)}
                    </p>
                  </div>
                  <BadgeEstado estado={reserva.estado} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
