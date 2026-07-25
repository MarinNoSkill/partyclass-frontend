import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  Hash,
  ListChecks,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { useConciliarAbonos, useDesasignarReserva } from '@/hooks/useNumeracion';
import { cn } from '@/utils/cn';
import type {
  ConciliacionResultado,
  NumeroDetalleConciliacion,
} from '@/types/numeracion.types';

const MAX_EXCEL_BYTES = 5 * 1024 * 1024;

type Filtro = 'sinAbonar' | 'abonados' | 'soloExcel';

/** Una reserva con todos sus números y cuántos le faltan por abonar. */
interface GrupoReserva {
  reservaId: string;
  reservaCodigo: string | null;
  estudianteNombre: string | null;
  estudianteDocumento: string | null;
  planNombre: string | null;
  numeros: NumeroDetalleConciliacion[];
  sinAbonar: number;
}

/** Agrupa por reserva las que tienen al menos un número sin abonar. */
function agruparAfectadas(numeros: NumeroDetalleConciliacion[]): GrupoReserva[] {
  const mapa = new Map<string, GrupoReserva>();

  for (const numero of numeros) {
    if (!numero.reserva_id) continue;

    let grupo = mapa.get(numero.reserva_id);
    if (!grupo) {
      grupo = {
        reservaId: numero.reserva_id,
        reservaCodigo: numero.reserva_codigo,
        estudianteNombre: numero.estudiante_nombre,
        estudianteDocumento: numero.estudiante_documento,
        planNombre: numero.plan_nombre,
        numeros: [],
        sinAbonar: 0,
      };
      mapa.set(numero.reserva_id, grupo);
    }
    grupo.numeros.push(numero);
    if (!numero.abonado) grupo.sinAbonar += 1;
  }

  return [...mapa.values()]
    .filter((g) => g.sinAbonar > 0)
    .map((g) => ({
      ...g,
      numeros: g.numeros.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    }))
    .sort((a, b) => (a.reservaCodigo ?? '').localeCompare(b.reservaCodigo ?? ''));
}

/** Chip de un número con su color según esté abonado o no. */
function ChipNumero({ numero, abonado }: { numero: string; abonado: boolean }) {
  return (
    <span
      title={abonado ? 'Abonado (está en el Excel)' : 'Sin abonar (falta en el Excel)'}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold',
        abonado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900',
      )}
    >
      {abonado ? <Check className="size-3" aria-hidden /> : <X className="size-3" aria-hidden />}
      {numero}
    </span>
  );
}

/**
 * Conciliación de abonos del sorteo.
 *
 * El admin sube un Excel con los números abonados; el resultado se abre en un
 * modal con filtros por las tres categorías: abonados (en el sistema y el
 * Excel), sin abonar (asignados pero no en el Excel → desasignables) y solo en
 * el Excel (en el Excel pero no asignados). "Desasignar" borra la reserva
 * completa.
 */
export function ConciliacionAbonos() {
  const entrada = useRef<HTMLInputElement>(null);
  const [resultado, setResultado] = useState<ConciliacionResultado | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('sinAbonar');
  const [busqueda, setBusqueda] = useState('');
  const [aDesasignar, setADesasignar] = useState<GrupoReserva | null>(null);

  const conciliar = useConciliarAbonos();
  const desasignar = useDesasignarReserva();
  const toast = useToast();

  const numeros = resultado?.numeros ?? [];
  const soloEnExcel = resultado?.soloEnExcel ?? [];

  // Recalculados en vivo: tras desasignar, los números de esa reserva se van.
  const abonados = useMemo(() => numeros.filter((n) => n.abonado), [numeros]);
  const sinAbonar = useMemo(() => numeros.filter((n) => !n.abonado), [numeros]);
  const reservasAfectadas = useMemo(() => agruparAfectadas(numeros), [numeros]);

  const q = busqueda.trim();
  const gruposFiltrados = q
    ? reservasAfectadas.filter(
        (g) =>
          g.numeros.some((n) => n.numero_formateado.includes(q)) ||
          (g.estudianteNombre ?? '').toLowerCase().includes(q.toLowerCase()) ||
          (g.reservaCodigo ?? '').toLowerCase().includes(q.toLowerCase()),
      )
    : reservasAfectadas;
  const abonadosFiltrados = q
    ? abonados.filter((n) => n.numero_formateado.includes(q))
    : abonados;
  const soloExcelFiltrado = q ? soloEnExcel.filter((n) => n.includes(q)) : soloEnExcel;

  const seleccionar = async (archivo: File | undefined) => {
    if (!archivo) return;

    if (!/\.(xlsx|xls)$/i.test(archivo.name)) {
      toast.error('El archivo debe ser un Excel (.xlsx o .xls).');
      return;
    }
    if (archivo.size > MAX_EXCEL_BYTES) {
      toast.error('El Excel supera el tamaño máximo de 5 MB.');
      return;
    }

    setNombreArchivo(archivo.name);
    try {
      const datos = await conciliar.mutateAsync(archivo);
      setResultado(datos);
      setFiltro(datos.totalSinAbonar > 0 ? 'sinAbonar' : 'abonados');
      setBusqueda('');
      setModalAbierto(true);
    } catch (fallo) {
      setResultado(null);
      toast.error(mensajeDeError(fallo));
    } finally {
      if (entrada.current) entrada.current.value = '';
    }
  };

  const confirmarDesasignar = async () => {
    if (!aDesasignar) return;

    try {
      await desasignar.mutateAsync(aDesasignar.reservaId);
      toast.exito(`Reserva ${aDesasignar.reservaCodigo ?? ''} desasignada.`);

      // Se quitan del resultado local los números de esa reserva.
      setResultado((previo) =>
        previo
          ? {
              ...previo,
              numeros: previo.numeros.filter((n) => n.reserva_id !== aDesasignar.reservaId),
            }
          : previo,
      );
      setADesasignar(null);
    } catch (fallo) {
      toast.error(mensajeDeError(fallo));
    }
  };

  const pestanas: Array<{ clave: Filtro; texto: string; conteo: number }> = [
    { clave: 'sinAbonar', texto: 'Sin abonar', conteo: sinAbonar.length },
    { clave: 'abonados', texto: 'Abonados', conteo: abonados.length },
    { clave: 'soloExcel', texto: 'Solo en Excel', conteo: soloEnExcel.length },
  ];

  return (
    <Card sinRelleno>
      <CardHeader
        titulo="Conciliación de abonos"
        descripcion="Sube el Excel con los números abonados. El resultado se abre en una ventana con filtros para revisar cada caso antes de desasignar."
        icono={<FileSpreadsheet className="size-5" aria-hidden />}
        acciones={
          resultado ? (
            <Button
              variante="secundario"
              tamano="sm"
              onClick={() => setModalAbierto(true)}
              iconoIzquierda={<ListChecks className="size-4" aria-hidden />}
            >
              Ver resultado
            </Button>
          ) : undefined
        }
      />

      <div className="p-4">
        <input
          ref={entrada}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(evento) => void seleccionar(evento.target.files?.[0])}
        />

        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={conciliar.isPending}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-tinta-300 bg-tinta-50/60 px-4 py-8 text-center transition-colors hover:border-marca-400 hover:bg-marca-50/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {conciliar.isPending ? (
            <Spinner />
          ) : (
            <Upload className="size-7 text-tinta-400" aria-hidden />
          )}
          <span className="text-sm font-medium text-tinta-700">
            {conciliar.isPending
              ? 'Comparando números…'
              : nombreArchivo ?? 'Selecciona el Excel de abonados'}
          </span>
          <span className="text-xs text-tinta-400">
            Una columna con los números de sorteo (4 dígitos). Formato .xlsx o .xls, máx. 5 MB.
          </span>
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Modal con el resultado                                            */}
      {/* ---------------------------------------------------------------- */}
      <Modal
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        titulo="Resultado de la conciliación"
        descripcion={nombreArchivo ?? undefined}
        tamano="xl"
        pie={
          <Button variante="secundario" onClick={() => setModalAbierto(false)}>
            Cerrar
          </Button>
        }
      >
        {resultado && (
          <>
            {/* Resumen */}
            <div className="flex flex-wrap gap-2">
              <Badge tono="neutro">{resultado.totalEnExcel} en el Excel</Badge>
              <Badge tono="marca">{numeros.length} asignados</Badge>
              <Badge tono="exito">{abonados.length} abonados</Badge>
              <Badge tono={sinAbonar.length > 0 ? 'alerta' : 'exito'}>
                {sinAbonar.length} sin abonar
              </Badge>
              <Badge tono="neutro">{soloEnExcel.length} solo en Excel</Badge>
            </div>

            {/* Filtros por categoría */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {pestanas.map((p) => (
                <button
                  key={p.clave}
                  type="button"
                  onClick={() => setFiltro(p.clave)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    filtro === p.clave
                      ? 'bg-marca-600 text-white'
                      : 'bg-tinta-100 text-tinta-600 hover:bg-tinta-200',
                  )}
                >
                  {p.texto}
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-xs',
                      filtro === p.clave ? 'bg-white/25' : 'bg-white text-tinta-500',
                    )}
                  >
                    {p.conteo}
                  </span>
                </button>
              ))}
            </div>

            {/* Buscador de número */}
            <div className="relative mt-3">
              <Hash className="absolute top-2.5 left-2.5 size-4 text-tinta-400" aria-hidden />
              <input
                value={busqueda}
                inputMode="numeric"
                placeholder="Buscar número, estudiante o reserva…"
                onChange={(evento) => setBusqueda(evento.target.value)}
                className="w-full rounded-lg border border-tinta-300 bg-white py-2 pr-3 pl-8 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
              />
            </div>

            <div className="mt-4">
              {/* --- Sin abonar: reservas afectadas --- */}
              {filtro === 'sinAbonar' &&
                (gruposFiltrados.length === 0 ? (
                  sinAbonar.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-tinta-200 bg-tinta-50/50 py-10 text-center">
                      <CheckCircle2 className="size-8 text-emerald-500" aria-hidden />
                      <p className="text-sm font-medium text-tinta-700">
                        Todos los números asignados están abonados.
                      </p>
                    </div>
                  ) : (
                    <EmptyState
                      icono={<Hash className="size-6" aria-hidden />}
                      titulo="Sin coincidencias"
                      descripcion="Ninguna reserva coincide con la búsqueda."
                    />
                  )
                ) : (
                  <>
                    <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                      <AlertTriangle className="mt-px size-4 shrink-0" aria-hidden />
                      <span>
                        Desasignar borra la reserva completa (datos, firmas y TODOS sus
                        números, también los abonados). No se puede deshacer.
                      </span>
                    </div>

                    <ul className="space-y-2.5">
                      {gruposFiltrados.map((grupo) => (
                        <li
                          key={grupo.reservaId}
                          className="flex flex-col gap-3 rounded-xl border border-tinta-200 p-3.5 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {grupo.estudianteNombre ? (
                                <span className="font-medium text-tinta-900">
                                  {grupo.estudianteNombre}
                                </span>
                              ) : (
                                <span className="text-tinta-400">Sin estudiante</span>
                              )}
                              <Link
                                to={`/admin/registros/${grupo.reservaId}`}
                                className="text-sm font-medium text-marca-600 hover:text-marca-700 hover:underline"
                              >
                                {grupo.reservaCodigo ?? 'Ver'}
                              </Link>
                              <Badge tono="alerta">{grupo.sinAbonar} sin abonar</Badge>
                            </div>

                            <p className="mt-0.5 text-xs text-tinta-500">
                              {grupo.estudianteDocumento}
                              {grupo.planNombre ? ` · ${grupo.planNombre}` : ''}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {grupo.numeros.map((numero) => (
                                <ChipNumero
                                  key={numero.numero_formateado}
                                  numero={numero.numero_formateado}
                                  abonado={numero.abonado}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="shrink-0">
                            <Button
                              variante="peligro"
                              tamano="sm"
                              onClick={() => setADesasignar(grupo)}
                              iconoIzquierda={<Trash2 className="size-3.5" aria-hidden />}
                            >
                              Desasignar
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                ))}

              {/* --- Abonados --- */}
              {filtro === 'abonados' &&
                (abonadosFiltrados.length === 0 ? (
                  <EmptyState
                    icono={<Hash className="size-6" aria-hidden />}
                    titulo="Sin abonados"
                    descripcion="Ningún número asignado coincide con el Excel y la búsqueda."
                  />
                ) : (
                  <ul className="divide-y divide-tinta-100 overflow-hidden rounded-xl border border-tinta-200">
                    {abonadosFiltrados.map((numero) => (
                      <li
                        key={numero.numero_formateado}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                      >
                        <ChipNumero numero={numero.numero_formateado} abonado />
                        <div className="min-w-0 flex-1 text-right">
                          <p className="truncate text-sm text-tinta-700">
                            {numero.estudiante_nombre ?? '—'}
                          </p>
                          <p className="truncate text-xs text-tinta-400">
                            {numero.plan_nombre ?? ''}
                          </p>
                        </div>
                        {numero.reserva_id && (
                          <Link
                            to={`/admin/registros/${numero.reserva_id}`}
                            className="shrink-0 text-xs font-medium text-marca-600 hover:underline"
                          >
                            {numero.reserva_codigo}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                ))}

              {/* --- Solo en Excel --- */}
              {filtro === 'soloExcel' &&
                (soloExcelFiltrado.length === 0 ? (
                  <EmptyState
                    icono={<Hash className="size-6" aria-hidden />}
                    titulo="Nada solo en el Excel"
                    descripcion="Todos los números del Excel están asignados en el sistema."
                  />
                ) : (
                  <>
                    <p className="mb-3 text-xs text-tinta-500">
                      Estos números están en el Excel pero no aparecen asignados en el sistema
                      (nunca se registraron o su reserva se borró). No hay nada que desasignar.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {soloExcelFiltrado.map((numero) => (
                        <span
                          key={numero}
                          className="rounded-md bg-tinta-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-tinta-600"
                        >
                          {numero}
                        </span>
                      ))}
                    </div>
                  </>
                ))}
            </div>
          </>
        )}
      </Modal>

      {/* Confirmación de desasignar (encima del modal de resultado) */}
      <Modal
        abierto={aDesasignar !== null}
        alCerrar={() => setADesasignar(null)}
        titulo="Desasignar reserva"
        tamano="sm"
      >
        <p className="text-sm text-tinta-600">
          Se eliminará por completo la reserva{' '}
          <strong className="text-tinta-900">{aDesasignar?.reservaCodigo}</strong>
          {aDesasignar?.estudianteNombre ? ` de ${aDesasignar.estudianteNombre}` : ''}: sus
          datos, firmas y sus {aDesasignar?.numeros.length} número(s) de sorteo, que volverán
          al pool.
        </p>
        {aDesasignar && aDesasignar.numeros.length > aDesasignar.sinAbonar && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Atención: {aDesasignar.numeros.length - aDesasignar.sinAbonar} de sus números SÍ
            están abonados y también se eliminarán.
          </p>
        )}
        <p className="mt-2 text-xs text-tinta-400">Esta acción no se puede deshacer.</p>

        <div className="mt-6 flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setADesasignar(null)}>
            Cancelar
          </Button>
          <Button variante="peligro" cargando={desasignar.isPending} onClick={confirmarDesasignar}>
            Desasignar
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
