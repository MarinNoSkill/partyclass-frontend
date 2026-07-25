import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hash, Search, SlidersHorizontal, X } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { EstadisticasNumeracionPanel } from './EstadisticasNumeracion';
import { ConciliacionAbonos } from './ConciliacionAbonos';
import {
  useEstadisticasNumeracion,
  useNumeracion,
  usePlanes,
} from '@/hooks/useNumeracion';
import { formatearFechaHora } from '@/utils/formato';
import { mensajeDeError } from '@/hooks/useMensajeError';
import type { EstadoNumero, FiltrosNumeracion } from '@/types/numeracion.types';

const FILTROS_INICIALES: FiltrosNumeracion = { pagina: 1, tamano: 20 };

export function NumeracionPage() {
  const [filtros, setFiltros] = useState<FiltrosNumeracion>(FILTROS_INICIALES);
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [textoNumero, setTextoNumero] = useState('');

  const consulta = useNumeracion(filtros);
  const estadisticas = useEstadisticasNumeracion();
  const planes = usePlanes();

  /** Cualquier cambio de filtro vuelve a la página 1. */
  const aplicar = (parcial: Partial<FiltrosNumeracion>) => {
    setFiltros((previos) => ({ ...previos, ...parcial, pagina: 1 }));
  };

  const limpiar = () => {
    setTextoBusqueda('');
    setTextoNumero('');
    setFiltros(FILTROS_INICIALES);
  };

  const hayFiltros = useMemo(
    () =>
      Boolean(
        filtros.estado ??
          filtros.numero ??
          filtros.anio ??
          filtros.planId ??
          filtros.desde ??
          filtros.hasta ??
          filtros.buscar,
      ),
    [filtros],
  );

  const aniosDisponibles = estadisticas.data?.porAnio.map((fila) => fila.anio) ?? [];

  return (
    <div className="space-y-5">
      <EstadisticasNumeracionPanel
        datos={estadisticas.data}
        cargando={estadisticas.isPending}
      />

      <ConciliacionAbonos />

      <Card sinRelleno>
        <CardHeader
          titulo="Control de numeración"
          descripcion="Consulta de los 10.000 números de convenio. Solo lectura: un número asignado no se modifica, reasigna ni elimina."
          icono={<Hash className="size-5" aria-hidden />}
        />

        {/* ---------------------------------------------------------------- */}
        {/* Filtros                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="border-y border-tinta-200 bg-tinta-50/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-tinta-600">
                Buscar número
              </span>
              <div className="relative">
                <Hash
                  className="absolute top-2.5 left-2.5 size-4 text-tinta-400"
                  aria-hidden
                />
                <input
                  value={textoNumero}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0042"
                  onChange={(evento) => {
                    const limpio = evento.target.value.replace(/\D/g, '');
                    setTextoNumero(limpio);
                    aplicar({ numero: limpio || undefined });
                  }}
                  className="w-full rounded-lg border border-tinta-300 bg-white py-2 pr-3 pl-8 font-mono text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-tinta-600">
                Estudiante, documento o reserva
              </span>
              <div className="relative">
                <Search
                  className="absolute top-2.5 left-2.5 size-4 text-tinta-400"
                  aria-hidden
                />
                <input
                  value={textoBusqueda}
                  placeholder="Nombre o documento…"
                  onChange={(evento) => {
                    setTextoBusqueda(evento.target.value);
                    aplicar({ buscar: evento.target.value.trim() || undefined });
                  }}
                  className="w-full rounded-lg border border-tinta-300 bg-white py-2 pr-3 pl-8 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-tinta-600">Estado</span>
              <select
                value={filtros.estado ?? ''}
                onChange={(evento) =>
                  aplicar({ estado: (evento.target.value || undefined) as EstadoNumero })
                }
                className="w-full rounded-lg border border-tinta-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
              >
                <option value="">Todos</option>
                <option value="DISPONIBLE">Disponibles</option>
                <option value="ASIGNADO">Asignados</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-tinta-600">Plan</span>
              <select
                value={filtros.planId ?? ''}
                onChange={(evento) => aplicar({ planId: evento.target.value || undefined })}
                className="w-full rounded-lg border border-tinta-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
              >
                <option value="">Todos</option>
                {planes.data?.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-tinta-600">Año</span>
              <select
                value={filtros.anio ?? ''}
                onChange={(evento) =>
                  aplicar({
                    anio: evento.target.value ? Number(evento.target.value) : undefined,
                  })
                }
                className="w-full rounded-lg border border-tinta-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
              >
                <option value="">Todos</option>
                {aniosDisponibles.map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-tinta-600">Desde</span>
              <input
                type="date"
                value={filtros.desde?.slice(0, 10) ?? ''}
                onChange={(evento) =>
                  aplicar({
                    desde: evento.target.value
                      ? new Date(`${evento.target.value}T00:00:00`).toISOString()
                      : undefined,
                  })
                }
                className="w-full rounded-lg border border-tinta-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-tinta-600">Hasta</span>
              <input
                type="date"
                value={filtros.hasta?.slice(0, 10) ?? ''}
                onChange={(evento) =>
                  aplicar({
                    hasta: evento.target.value
                      ? new Date(`${evento.target.value}T23:59:59`).toISOString()
                      : undefined,
                  })
                }
                className="w-full rounded-lg border border-tinta-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
              />
            </label>

            <div className="flex items-end">
              <Button
                variante="secundario"
                anchoCompleto
                disabled={!hayFiltros}
                onClick={limpiar}
                iconoIzquierda={<X className="size-4" aria-hidden />}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Resultados                                                        */}
        {/* ---------------------------------------------------------------- */}
        {consulta.isPending ? (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        ) : consulta.isError ? (
          <div className="p-6">
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {mensajeDeError(consulta.error)}
            </p>
          </div>
        ) : consulta.data.data.length === 0 ? (
          <EmptyState
            icono={<SlidersHorizontal className="size-6" aria-hidden />}
            titulo="Sin resultados"
            descripcion="Ningún número coincide con los filtros aplicados."
          />
        ) : (
          <>
            {/* Tabla en pantallas medianas y grandes */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-tinta-200 bg-tinta-50 text-xs tracking-wide text-tinta-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Número</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Estudiante</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Año</th>
                    <th className="px-4 py-3 font-medium">Asignado el</th>
                    <th className="px-4 py-3 font-medium">Convenio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tinta-100">
                  {consulta.data.data.map((fila) => (
                    <tr key={fila.id} className="transition-colors hover:bg-tinta-50/70">
                      <td className="px-4 py-3">
                        <span className="font-mono text-base font-semibold text-tinta-900">
                          {fila.numero_formateado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tono={fila.estado === 'ASIGNADO' ? 'marca' : 'exito'}>
                          {fila.estado === 'ASIGNADO' ? 'Asignado' : 'Disponible'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {fila.estudiante_nombre ? (
                          <div>
                            <p className="font-medium text-tinta-900">
                              {fila.estudiante_nombre}
                            </p>
                            <p className="text-xs text-tinta-500">
                              {fila.estudiante_documento}
                              {fila.estudiante_grado ? ` · ${fila.estudiante_grado}` : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-tinta-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-tinta-600">{fila.plan_nombre ?? '—'}</td>
                      <td className="px-4 py-3 text-tinta-600">{fila.anio ?? '—'}</td>
                      <td className="px-4 py-3 text-tinta-600">
                        {fila.fecha_asignacion
                          ? formatearFechaHora(fila.fecha_asignacion)
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {fila.reserva_id ? (
                          <Link
                            to={`/admin/registros/${fila.reserva_id}`}
                            className="font-medium text-marca-600 hover:text-marca-700 hover:underline"
                          >
                            {fila.reserva_codigo}
                          </Link>
                        ) : (
                          <span className="text-tinta-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas en móvil */}
            <ul className="divide-y divide-tinta-100 md:hidden">
              {consulta.data.data.map((fila) => (
                <li key={fila.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-lg font-semibold text-tinta-900">
                      {fila.numero_formateado}
                    </span>
                    <Badge tono={fila.estado === 'ASIGNADO' ? 'marca' : 'exito'}>
                      {fila.estado === 'ASIGNADO' ? 'Asignado' : 'Disponible'}
                    </Badge>
                  </div>

                  {fila.estudiante_nombre && (
                    <p className="mt-2 text-sm font-medium text-tinta-900">
                      {fila.estudiante_nombre}
                    </p>
                  )}
                  {fila.fecha_asignacion && (
                    <p className="mt-0.5 text-xs text-tinta-500">
                      {fila.plan_nombre} · {formatearFechaHora(fila.fecha_asignacion)}
                    </p>
                  )}
                  {fila.reserva_id && (
                    <Link
                      to={`/admin/registros/${fila.reserva_id}`}
                      className="mt-2 inline-block text-sm font-medium text-marca-600 hover:underline"
                    >
                      Ver convenio {fila.reserva_codigo}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <div className="border-t border-tinta-200 p-4">
              <Pagination
                meta={consulta.data.meta}
                alCambiarPagina={(pagina) =>
                  setFiltros((previos) => ({ ...previos, pagina }))
                }
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
