import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, FileSpreadsheet, Plus, Trash2, UserPlus } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/forms/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { autorizacionesService } from '@/services/autorizaciones.service';

/** Sub-módulo: documentos que pueden entrar al módulo de Autorizaciones. */
export function DocumentosPermitidos() {
  const { exito, error: errorToast } = useToast();

  const [permitidos, setPermitidos] = useState<string[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [nuevos, setNuevos] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const excel = useRef<HTMLInputElement>(null);

  useEffect(() => {
    autorizacionesService
      .listarPermitidos()
      .then(setPermitidos)
      .catch((f) => errorToast('No se pudo cargar la lista', mensajeDeError(f)))
      .finally(() => setCargandoLista(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const agregarManual = async () => {
    const docs = nuevos.split(/[\s,;]+/).map((d) => d.trim()).filter(Boolean);
    if (docs.length === 0) return;
    setOcupado(true);
    try {
      setPermitidos(await autorizacionesService.agregarPermitidos(docs));
      setNuevos('');
      exito('Documentos agregados');
    } catch (f) {
      errorToast('No se pudo agregar', mensajeDeError(f));
    } finally {
      setOcupado(false);
    }
  };

  const eliminar = async (doc: string) => {
    setOcupado(true);
    try {
      setPermitidos(await autorizacionesService.eliminarPermitido(doc));
    } catch (f) {
      errorToast('No se pudo eliminar', mensajeDeError(f));
    } finally {
      setOcupado(false);
    }
  };

  const subir = async (archivo: File) => {
    setOcupado(true);
    try {
      const r = await autorizacionesService.cargarPermitidosExcel(archivo);
      setPermitidos(r.lista);
      exito('Documentos permitidos cargados', `${r.encontrados} encontrados en el Excel.`);
    } catch (f) {
      errorToast('No se pudo cargar el Excel', mensajeDeError(f));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Card sinRelleno>
      <CardHeader
        titulo="Documentos permitidos"
        descripcion="Solo estos documentos pueden entrar al módulo de autorizaciones. Cárgalos a mano o por Excel."
        icono={<BadgeCheck className="size-5" aria-hidden />}
      />

      <div className="space-y-4 border-t border-tinta-200 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            etiqueta="Agregar documentos (separados por coma o espacio)"
            value={nuevos}
            onChange={(e) => setNuevos(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => void agregarManual()}
            disabled={ocupado || nuevos.trim() === ''}
            iconoIzquierda={<Plus className="size-4" aria-hidden />}
          >
            Agregar
          </Button>
          <Button
            variante="contorno"
            onClick={() => excel.current?.click()}
            disabled={ocupado}
            iconoIzquierda={<FileSpreadsheet className="size-4" aria-hidden />}
          >
            Cargar Excel
          </Button>
          <input
            ref={excel}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void subir(f);
            }}
          />
        </div>

        {cargandoLista ? (
          <Spinner className="size-6" />
        ) : permitidos.length === 0 ? (
          <p className="text-sm text-tinta-400">Aún no hay documentos permitidos.</p>
        ) : (
          <>
            <p className="text-xs text-tinta-500">{permitidos.length} documento(s)</p>
            <div className="flex flex-wrap gap-2">
              {permitidos.map((doc) => (
                <span
                  key={doc}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-tinta-200 px-2.5 py-1 text-sm text-tinta-800"
                >
                  {doc}
                  <button
                    type="button"
                    onClick={() => void eliminar(doc)}
                    disabled={ocupado}
                    aria-label={`Quitar ${doc}`}
                    className="text-tinta-400 hover:text-red-500"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/** Sub-módulo: carga masiva de estudiantes no registrados (Excel). */
export function CargarEstudiantes() {
  const { exito, error: errorToast } = useToast();
  const [ocupado, setOcupado] = useState(false);
  const excel = useRef<HTMLInputElement>(null);

  const subir = async (archivo: File) => {
    setOcupado(true);
    try {
      const r = await autorizacionesService.cargarAlumnosExcel(archivo);
      exito(
        'Estudiantes cargados',
        `${r.procesados} procesados · ${r.incompletos} con datos incompletos.`,
      );
    } catch (f) {
      errorToast('No se pudo cargar el Excel', mensajeDeError(f));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Card sinRelleno>
      <CardHeader
        titulo="Cargar estudiantes no registrados"
        descripcion="Sube un Excel con el formato de la base (numero_documento, primer_nombre, primer_apellido, email, fecha_nacimiento…). Si falta algún dato, el estudiante lo completará al entrar."
        icono={<UserPlus className="size-5" aria-hidden />}
      />

      <div className="space-y-3 border-t border-tinta-200 p-4">
        <Button
          onClick={() => excel.current?.click()}
          disabled={ocupado}
          iconoIzquierda={<FileSpreadsheet className="size-4" aria-hidden />}
        >
          Cargar Excel de estudiantes
        </Button>
        <input
          ref={excel}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void subir(f);
          }}
        />
        <p className="text-xs text-tinta-500">
          La primera fila debe tener los encabezados. Acepta alias como <code>documento</code>,{' '}
          <code>nombre</code>, <code>correo</code>, <code>colegio</code>.
        </p>
      </div>
    </Card>
  );
}
