import { useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ImageUp,
  Images,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/contexts/ToastContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { usePlanesAdmin } from '@/hooks/usePlanes';
import {
  useAlternarImagenLanding,
  useEliminarImagenLanding,
  useImagenesLanding,
  useMoverImagenLanding,
  useSubirImagenLanding,
} from '@/hooks/useLanding';
import { cn } from '@/utils/cn';
import type { ImagenLandingConUrl, SeccionLanding } from '@/types/landing.types';

const MAX_BYTES = 15 * 1024 * 1024;
const MIMES = ['image/jpeg', 'image/png'];

/**
 * Gestión de las imágenes del inicio público: el banner superior (hero) y las
 * tarjetas de cada año. Se pueden subir varias por sección; el front las rota.
 */
export function InicioImagenesPage() {
  const imagenes = useImagenesLanding();
  const planes = usePlanesAdmin();

  // Años a mostrar: los de los planes + los que ya tengan imágenes.
  const anios = useMemo(() => {
    const set = new Set<number>();
    (planes.data ?? []).forEach((p) => set.add(p.anio));
    (imagenes.data ?? []).forEach((i) => i.anio !== null && set.add(i.anio));
    return [...set].sort((a, b) => b - a);
  }, [planes.data, imagenes.data]);

  const hero = (imagenes.data ?? []).filter((i) => i.seccion === 'hero');
  const porAnio = (anio: number) =>
    (imagenes.data ?? []).filter((i) => i.seccion === 'anio' && i.anio === anio);

  return (
    <div className="space-y-5">
      <Card sinRelleno>
        <CardHeader
          titulo="Imágenes del inicio"
          descripcion="Sube las imágenes que verán los estudiantes: el banner de arriba y las de cada año. Puedes poner varias y ordenarlas; se irán mostrando en rotación."
          icono={<Images className="size-5" aria-hidden />}
        />
      </Card>

      {imagenes.isPending ? (
        <div className="grid place-items-center py-16">
          <Spinner />
        </div>
      ) : imagenes.isError ? (
        <Card>
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {mensajeDeError(imagenes.error)}
          </p>
        </Card>
      ) : (
        <>
          <PanelSeccion
            titulo="Banner superior (hero)"
            descripcion="La imagen grande de la parte de arriba del inicio."
            seccion="hero"
            anio={null}
            imagenes={hero}
          />

          {anios.length === 0 ? (
            <Card>
              <p className="text-sm text-tinta-500">
                Cuando crees planes por año, aquí aparecerá un bloque para subir la imagen de
                cada año.
              </p>
            </Card>
          ) : (
            anios.map((anio) => (
              <PanelSeccion
                key={anio}
                titulo={`Tarjeta del año ${anio}`}
                descripcion={`La imagen que se muestra en la tarjeta de ${anio}.`}
                seccion="anio"
                anio={anio}
                imagenes={porAnio(anio)}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

interface PropsPanel {
  titulo: string;
  descripcion: string;
  seccion: SeccionLanding;
  anio: number | null;
  imagenes: ImagenLandingConUrl[];
}

function PanelSeccion({ titulo, descripcion, seccion, anio, imagenes }: PropsPanel) {
  const entrada = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const subir = useSubirImagenLanding();
  const alternar = useAlternarImagenLanding();
  const mover = useMoverImagenLanding();
  const eliminar = useEliminarImagenLanding();

  const conMensaje = async (accion: Promise<unknown>, ok: string) => {
    try {
      await accion;
      toast.exito(ok);
    } catch (fallo) {
      toast.error(mensajeDeError(fallo));
    }
  };

  const seleccionar = async (archivo: File | undefined) => {
    if (!archivo) return;
    if (!MIMES.includes(archivo.type)) {
      toast.error('La imagen debe ser JPG o PNG.');
      return;
    }
    if (archivo.size > MAX_BYTES) {
      toast.error('La imagen supera el tamaño máximo de 15 MB.');
      return;
    }
    try {
      await subir.mutateAsync({ seccion, anio, archivo });
      toast.exito('Imagen añadida.');
    } catch (fallo) {
      toast.error(mensajeDeError(fallo));
    } finally {
      if (entrada.current) entrada.current.value = '';
    }
  };

  return (
    <Card sinRelleno>
      <CardHeader
        titulo={titulo}
        descripcion={descripcion}
        icono={<ImageIcon className="size-5" aria-hidden />}
        className="p-4 sm:p-5"
        acciones={
          <Button
            tamano="sm"
            cargando={subir.isPending}
            onClick={() => entrada.current?.click()}
            iconoIzquierda={<ImageUp className="size-4" aria-hidden />}
          >
            Añadir
          </Button>
        }
      />

      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(evento) => void seleccionar(evento.target.files?.[0])}
      />

      <div className="border-t border-tinta-200 p-4">
        {imagenes.length === 0 ? (
          <p className="py-6 text-center text-sm text-tinta-400">
            Sin imágenes todavía. Usa «Añadir» para subir la primera.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {imagenes.map((imagen, indice) => (
              <li
                key={imagen.id}
                className={cn(
                  'overflow-hidden rounded-xl border bg-white',
                  imagen.activo ? 'border-tinta-200' : 'border-dashed border-tinta-300',
                )}
              >
                <div className="relative aspect-4/3 bg-tinta-100">
                  {imagen.url ? (
                    <img
                      src={imagen.url}
                      alt={imagen.nombre}
                      loading="lazy"
                      decoding="async"
                      className={cn(
                        'h-full w-full object-cover',
                        !imagen.activo && 'opacity-40 grayscale',
                      )}
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-tinta-300">
                      <ImageIcon className="size-6" aria-hidden />
                    </span>
                  )}
                  {!imagen.activo && (
                    <span className="absolute top-1.5 left-1.5">
                      <Badge tono="neutro">Oculta</Badge>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={indice === 0 || mover.isPending}
                      onClick={() =>
                        void mover.mutateAsync({ id: imagen.id, direccion: 'subir' })
                      }
                      aria-label="Mover antes"
                      className="rounded-md p-1.5 text-tinta-500 transition-colors hover:bg-tinta-100 disabled:opacity-30"
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={indice === imagenes.length - 1 || mover.isPending}
                      onClick={() =>
                        void mover.mutateAsync({ id: imagen.id, direccion: 'bajar' })
                      }
                      aria-label="Mover después"
                      className="rounded-md p-1.5 text-tinta-500 transition-colors hover:bg-tinta-100 disabled:opacity-30"
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        void conMensaje(
                          alternar.mutateAsync({ id: imagen.id, activo: !imagen.activo }),
                          imagen.activo ? 'Imagen oculta.' : 'Imagen visible.',
                        )
                      }
                      aria-label={imagen.activo ? 'Ocultar' : 'Mostrar'}
                      className="rounded-md p-1.5 text-tinta-500 transition-colors hover:bg-tinta-100"
                    >
                      {imagen.activo ? (
                        <Eye className="size-4" aria-hidden />
                      ) : (
                        <EyeOff className="size-4" aria-hidden />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void conMensaje(eliminar.mutateAsync(imagen.id), 'Imagen eliminada.')
                      }
                      aria-label="Eliminar"
                      className="rounded-md p-1.5 text-tinta-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
