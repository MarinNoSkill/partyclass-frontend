import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, FileSpreadsheet, Hash, Inbox, Search, Table2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfiguracionContratos } from './ConfiguracionContratos';
import { AutorizacionesCargas } from './AutorizacionesCargas';
import { Badge, BadgeEstado } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/contexts/ToastContext';
import { useListaReservas } from '@/hooks/useReservas';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { registroService } from '@/services/registro.service';
import { formatearFechaHora } from '@/utils/formato';
import type { EstadoReserva, ReservaResumen } from '@/types/dominio.types';

const TAMANO_PAGINA = 20;

const FILTROS_ESTADO: Array<{ valor: EstadoReserva | 'TODAS'; etiqueta: string }> = [
  { valor: 'TODAS', etiqueta: 'Todos' },
  { valor: 'BORRADOR', etiqueta: 'Borradores' },
  { valor: 'COMPLETADA', etiqueta: 'Completados' },
  { valor: 'ANULADA', etiqueta: 'Anulados' },
];

/**
 * Listado del panel. A diferencia del listado operativo, este enlaza a la
 * vista de auditoría en profundidad y muestra el número de convenio.
 */
export function RegistrosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<EstadoReserva | 'TODAS'>('TODAS');
  const [pagina, setPagina] = useState(1);

  const filtros = useMemo(
    () => ({
      pagina,
      tamano: TAMANO_PAGINA,
      ...(busqueda.trim() ? { buscar: busqueda.trim() } : {}),
      ...(estado !== 'TODAS' ? { estado } : {}),
    }),
    [pagina, busqueda, estado],
  );

  const { data, isPending, isError, error } = useListaReservas(filtros);
  const [registroAEliminar, setRegistroAEliminar] = useState<ReservaResumen | null>(null);

  const cliente = useQueryClient();
  const toast = useToast();

  const eliminar = useMutation({
    mutationFn: (id: string) => registroService.eliminar(id),
    onSuccess: (resultado) => {
      void cliente.invalidateQueries({ queryKey: ['reservas'] });
      void cliente.invalidateQueries({ queryKey: ['numeracion'] });
      void cliente.invalidateQueries({ queryKey: ['dashboard'] });

      toast.exito(
        `Registro ${resultado.codigo} eliminado`,
        resultado.numerosLiberados.length > 0
          ? `Números liberados: ${resultado.numerosLiberados.join(', ')}.`
          : undefined,
      );
      cerrarConfirmacion();
    },
    onError: (fallo) => toast.error(mensajeDeError(fallo)),
  });

  const cerrarConfirmacion = () => setRegistroAEliminar(null);

  const [exportando, setExportando] = useState(false);
  const [vista, setVista] = useState<'registros' | 'autorizaciones' | 'contratos'>('registros');

  const exportar = async () => {
    setExportando(true);
    try {
      const blob = await registroService.exportarExcel();
      const url = URL.createObjectURL(blob);

      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `registros-${new Date().toISOString().slice(0, 10)}.xlsx`;
      enlace.click();
      URL.revokeObjectURL(url);

      // El export marcó los registros como descargados: se refresca el listado
      // para que sus badges pasen a «Descargado».
      void cliente.invalidateQueries({ queryKey: ['reservas'] });
    } catch (fallo) {
      toast.error(mensajeDeError(fallo));
    } finally {
      setExportando(false);
    }
  };

  return (
    <>
    <div className="mb-5 flex flex-wrap gap-1 rounded-xl border border-tinta-200 bg-tinta-50 p-1">
      {([
        { clave: 'registros', etiqueta: 'Registros' },
        { clave: 'autorizaciones', etiqueta: 'Autorizaciones' },
        { clave: 'contratos', etiqueta: 'Configuración de contratos' },
      ] as const).map((t) => (
        <button
          key={t.clave}
          type="button"
          onClick={() => setVista(t.clave)}
          className={
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ' +
            (vista === t.clave ? 'bg-marca-600 text-white shadow-sm' : 'text-tinta-600 hover:bg-white')
          }
        >
          {t.etiqueta}
        </button>
      ))}
    </div>

    {vista === 'autorizaciones' && <AutorizacionesCargas />}

    {vista === 'contratos' && <ConfiguracionContratos />}

    {vista === 'registros' && (
    <Card sinRelleno>
      <CardHeader
        titulo="Registros"
        descripcion="Consulta a fondo de cada reserva: datos, firmas y convenio."
        icono={<Table2 className="size-5" aria-hidden />}
        acciones={
          <Button
            variante="secundario"
            tamano="sm"
            cargando={exportando}
            onClick={() => void exportar()}
            iconoIzquierda={<FileSpreadsheet className="size-4" aria-hidden />}
          >
            Descargar Excel
          </Button>
        }
      />

      <div className="flex flex-col gap-3 border-y border-tinta-200 bg-tinta-50/60 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-tinta-400"
            aria-hidden
          />
          <input
            value={busqueda}
            placeholder="Código, nombre o documento del estudiante…"
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setPagina(1);
            }}
            className="w-full rounded-lg border border-tinta-300 bg-white py-2 pr-3 pl-10 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
          />
        </div>

        <select
          value={estado}
          onChange={(evento) => {
            setEstado(evento.target.value as EstadoReserva | 'TODAS');
            setPagina(1);
          }}
          className="rounded-lg border border-tinta-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
        >
          {FILTROS_ESTADO.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      </div>

      {isPending ? (
        <div className="grid place-items-center py-16">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="p-6">
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {mensajeDeError(error)}
          </p>
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState
          icono={<Inbox className="size-6" aria-hidden />}
          titulo="Sin registros"
          descripcion="No hay reservas que coincidan con la búsqueda."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-tinta-200 bg-tinta-50 text-xs tracking-wide text-tinta-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Reserva</th>
                  <th className="px-4 py-3 font-medium">Estudiante</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Firmas</th>
                  <th className="px-4 py-3 font-medium">Actualizado</th>
                  <th className="px-4 py-3 font-medium">Números asignados</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-tinta-100">
                {data.items.map((reserva) => (
                  <tr key={reserva.id} className="transition-colors hover:bg-tinta-50/70">
                    <td className="px-4 py-3 font-medium text-tinta-900">
                      {reserva.codigo}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-tinta-900">{reserva.estudiante_nombre ?? '—'}</p>
                      <p className="text-xs text-tinta-500">
                        {reserva.estudiante_documento ?? ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <BadgeEstado estado={reserva.estado} />
                        {reserva.estado === 'COMPLETADA' &&
                          reserva.total_firmas < reserva.total_acudientes && (
                            <Badge tono="alerta">Pendiente de firmas</Badge>
                          )}
                        {reserva.descargado_en ? (
                          <span title={`Descargado el ${formatearFechaHora(reserva.descargado_en)}`}>
                            <Badge tono="neutro">Descargado</Badge>
                          </span>
                        ) : (
                          <Badge tono="marca">Nuevo</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-tinta-600">
                      {reserva.total_firmas}/{reserva.total_acudientes}
                    </td>
                    <td className="px-4 py-3 text-tinta-600">
                      {formatearFechaHora(reserva.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      {reserva.numero_convenio ? (
                        <span className="inline-flex items-center gap-1 font-mono text-base font-semibold text-marca-700">
                          <Hash className="size-3.5" aria-hidden />
                          {reserva.numero_convenio}
                        </span>
                      ) : (
                        <span className="text-tinta-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/registros/${reserva.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-marca-600 transition-colors hover:bg-marca-50"
                        >
                          <Eye className="size-4" aria-hidden />
                          Ver a fondo
                        </Link>

                        <button
                          type="button"
                          onClick={() => setRegistroAEliminar(reserva)}
                          aria-label={`Eliminar el registro ${reserva.codigo}`}
                          className="rounded-lg p-2 text-tinta-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-tinta-200 p-4">
            <Pagination meta={data.meta} alCambiarPagina={setPagina} />
          </div>
        </>
      )}
    </Card>
    )}

    <Modal
      abierto={registroAEliminar !== null}
      alCerrar={cerrarConfirmacion}
      titulo="Eliminar registro"
      tamano="sm"
    >
      <p className="text-sm text-tinta-600">
        ¿Seguro que quieres eliminar el registro{' '}
        <strong className="text-tinta-900">{registroAEliminar?.codigo}</strong>? Esta acción no
        se puede deshacer.
      </p>

      <div className="mt-6 flex justify-end gap-2">
        <Button variante="secundario" onClick={cerrarConfirmacion} disabled={eliminar.isPending}>
          Cancelar
        </Button>
        <Button
          variante="peligro"
          cargando={eliminar.isPending}
          onClick={() => registroAEliminar && eliminar.mutate(registroAEliminar.id)}
          iconoIzquierda={<Trash2 className="size-4" aria-hidden />}
        >
          Eliminar
        </Button>
      </div>
    </Modal>
    </>
  );
}
