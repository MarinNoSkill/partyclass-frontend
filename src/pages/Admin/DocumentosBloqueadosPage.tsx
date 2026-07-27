import { useMemo, useRef, useState } from 'react';
import { Ban, FileSpreadsheet, Plus, ShieldOff, Trash2, X } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { usePlanesAdmin } from '@/hooks/usePlanes';
import {
  useBloquearDocumentos,
  useCargarExcelDocumentos,
  useDesbloquearDocumento,
  useDocumentosBloqueados,
} from '@/hooks/useDocumentosBloqueados';
import { cn } from '@/utils/cn';

/**
 * Bloqueo manual de documentos. El admin escribe uno o varios documentos y
 * elige el año (o «todos»): esos documentos ya no podrán registrarse.
 */
export function DocumentosBloqueadosPage() {
  const lista = useDocumentosBloqueados();
  const planes = usePlanesAdmin();
  const bloquear = useBloquearDocumentos();
  const cargarExcel = useCargarExcelDocumentos();
  const desbloquear = useDesbloquearDocumento();
  const toast = useToast();
  const entradaExcel = useRef<HTMLInputElement>(null);

  const [texto, setTexto] = useState('');
  const [todos, setTodos] = useState(true);
  const [aniosSel, setAniosSel] = useState<Set<number>>(new Set());

  const anios = useMemo(
    () => [...new Set((planes.data ?? []).map((p) => p.anio))].sort((a, b) => b - a),
    [planes.data],
  );

  const alternarAnio = (anio: number) => {
    setAniosSel((previo) => {
      const copia = new Set(previo);
      if (copia.has(anio)) copia.delete(anio);
      else copia.add(anio);
      return copia;
    });
  };

  const onBloquear = async () => {
    const documentos = texto
      .split(/[\s,;]+/)
      .map((d) => d.trim())
      .filter(Boolean);

    if (documentos.length === 0) {
      toast.error('Escribe al menos un documento.');
      return;
    }
    if (!todos && aniosSel.size === 0) {
      toast.error('Elige al menos un año, o marca «Todos los años».');
      return;
    }

    try {
      await bloquear.mutateAsync({
        documentos,
        anios: todos ? null : [...aniosSel],
      });
      toast.exito(
        `${documentos.length} documento(s) bloqueado(s).`,
        todos ? 'En todos los años.' : `En ${[...aniosSel].sort((a, b) => a - b).join(', ')}.`,
      );
      setTexto('');
    } catch (fallo) {
      toast.error(mensajeDeError(fallo));
    }
  };

  const detalleAnios = () =>
    todos ? 'En todos los años.' : `En ${[...aniosSel].sort((a, b) => a - b).join(', ')}.`;

  const seleccionarExcel = async (archivo: File | undefined) => {
    if (!archivo) return;
    if (!/\.(xlsx|xls)$/i.test(archivo.name)) {
      toast.error('El archivo debe ser un Excel (.xlsx o .xls).');
      return;
    }
    if (!todos && aniosSel.size === 0) {
      toast.error('Elige al menos un año, o marca «Todos los años».');
      return;
    }
    try {
      const res = await cargarExcel.mutateAsync({
        archivo,
        anios: todos ? null : [...aniosSel],
      });
      toast.exito(`${res.encontrados} documento(s) del Excel bloqueado(s).`, detalleAnios());
    } catch (fallo) {
      toast.error(mensajeDeError(fallo));
    } finally {
      if (entradaExcel.current) entradaExcel.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      <Card sinRelleno>
        <CardHeader
          titulo="Documentos bloqueados"
          descripcion="Marca documentos que no podrán registrarse. Puedes bloquearlos en un año, en varios o en todos."
          icono={<ShieldOff className="size-5" aria-hidden />}
        />

        <div className="space-y-4 border-t border-tinta-200 p-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-tinta-700">
              Documento(s)
            </span>
            <textarea
              rows={2}
              value={texto}
              placeholder="Escribe uno o varios documentos separados por coma, espacio o salto de línea"
              onChange={(evento) => setTexto(evento.target.value)}
              className="w-full resize-none rounded-lg border border-tinta-300 px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-tinta-700">Años</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTodos(true)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  todos
                    ? 'bg-marca-600 text-white'
                    : 'bg-tinta-100 text-tinta-600 hover:bg-tinta-200',
                )}
              >
                Todos los años
              </button>

              {anios.map((anio) => {
                const activo = !todos && aniosSel.has(anio);
                return (
                  <button
                    key={anio}
                    type="button"
                    onClick={() => {
                      setTodos(false);
                      alternarAnio(anio);
                    }}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      activo
                        ? 'bg-marca-600 text-white'
                        : 'bg-tinta-100 text-tinta-600 hover:bg-tinta-200',
                    )}
                  >
                    {anio}
                  </button>
                );
              })}
            </div>
            {anios.length === 0 && (
              <p className="mt-1 text-xs text-tinta-400">
                Aún no hay años con planes; puedes bloquear en «todos los años».
              </p>
            )}
          </div>

          <input
            ref={entradaExcel}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(evento) => void seleccionarExcel(evento.target.files?.[0])}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variante="secundario"
              cargando={cargarExcel.isPending}
              onClick={() => entradaExcel.current?.click()}
              iconoIzquierda={<FileSpreadsheet className="size-4" aria-hidden />}
            >
              Importar Excel
            </Button>
            <Button
              cargando={bloquear.isPending}
              onClick={() => void onBloquear()}
              iconoIzquierda={<Ban className="size-4" aria-hidden />}
            >
              Bloquear
            </Button>
          </div>

          <p className="text-xs text-tinta-400">
            El Excel se bloquea con la misma selección de años de arriba. Se leen las celdas
            con números de documento (con al menos un dígito).
          </p>
        </div>
      </Card>

      {/* Lista de bloqueados */}
      <Card sinRelleno>
        <CardHeader
          titulo="Bloqueados actualmente"
          descripcion="Toca una etiqueta de año para quitar ese bloqueo, o el bote para quitar todo el documento."
          icono={<Plus className="size-5 rotate-45" aria-hidden />}
          className="p-4 sm:p-5"
          acciones={
            <Badge tono={(lista.data ?? []).length > 0 ? 'marca' : 'neutro'}>
              {(lista.data ?? []).length} documento{(lista.data ?? []).length === 1 ? '' : 's'}
            </Badge>
          }
        />

        <div className="border-t border-tinta-200 p-4">
          {lista.isPending ? (
            <div className="grid place-items-center py-10">
              <Spinner />
            </div>
          ) : lista.isError ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {mensajeDeError(lista.error)}
            </p>
          ) : (lista.data ?? []).length === 0 ? (
            <EmptyState
              icono={<ShieldOff className="size-6" aria-hidden />}
              titulo="Sin documentos bloqueados"
              descripcion="Los documentos que bloquees aparecerán aquí."
            />
          ) : (
            <ul className="divide-y divide-tinta-100">
              {(lista.data ?? []).map((doc, indice) => (
                <li
                  key={doc.numero_documento}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-tinta-100 text-xs font-semibold text-tinta-500 tabular-nums">
                    {indice + 1}
                  </span>
                  <span className="min-w-0 flex-1 font-mono text-sm font-semibold text-tinta-900">
                    {doc.numero_documento}
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {doc.todos ? (
                      <button
                        type="button"
                        onClick={() =>
                          void desbloquear
                            .mutateAsync({ documento: doc.numero_documento, anio: 'todos' })
                            .catch(() => undefined)
                        }
                        className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-200"
                      >
                        Todos los años
                        <X className="size-3" aria-hidden />
                      </button>
                    ) : (
                      doc.anios.map((anio) => (
                        <button
                          key={anio}
                          type="button"
                          onClick={() =>
                            void desbloquear
                              .mutateAsync({ documento: doc.numero_documento, anio })
                              .catch(() => undefined)
                          }
                          className="inline-flex items-center gap-1 rounded-md bg-marca-100 px-2 py-0.5 text-xs font-semibold text-marca-800 transition-colors hover:bg-marca-200"
                        >
                          {anio}
                          <X className="size-3" aria-hidden />
                        </button>
                      ))
                    )}

                    <Badge tono="neutro">
                      {doc.todos ? 'todos' : `${doc.anios.length} año(s)`}
                    </Badge>

                    <button
                      type="button"
                      onClick={() =>
                        void desbloquear
                          .mutateAsync({ documento: doc.numero_documento })
                          .catch(() => undefined)
                      }
                      aria-label={`Quitar ${doc.numero_documento}`}
                      className="rounded-md p-1.5 text-tinta-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
