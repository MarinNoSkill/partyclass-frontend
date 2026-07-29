import { Plus, Trash2, Users } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { CompaneroInput } from '@/services/representante.service';

interface Props {
  companeros: CompaneroInput[];
  alCambiar: (indice: number, campo: keyof CompaneroInput, valor: string) => void;
  alAgregarFila: () => void;
  alQuitarFila: (indice: number) => void;
}

/**
 * Tabla para anexar compañeros: nombre + WhatsApp. Empieza con 20 filas y se
 * pueden añadir más. Las filas vacías se ignoran al enviar.
 */
export function CompanerosTable({ companeros, alCambiar, alAgregarFila, alQuitarFila }: Props) {
  const llenas = companeros.filter((c) => c.nombre.trim() || c.whatsapp.trim()).length;

  return (
    <Card sinRelleno>
      <CardHeader
        titulo="Compañeros"
        descripcion="Anexa a tus compañeros con su nombre y WhatsApp. Puedes dejar filas en blanco; se ignoran."
        icono={<Users className="size-5" aria-hidden />}
        className="p-4 sm:p-5"
        acciones={<span className="text-sm text-tinta-500">{llenas} con datos</span>}
      />

      <div className="overflow-x-auto border-t border-tinta-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-tinta-200 bg-tinta-50 text-xs tracking-wide text-tinta-500 uppercase">
            <tr>
              <th className="w-10 px-3 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium">Nombre</th>
              <th className="px-3 py-2.5 font-medium">WhatsApp</th>
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-tinta-100">
            {companeros.map((c, i) => (
              <tr key={i}>
                <td className="px-3 py-1.5 text-center text-xs text-tinta-400 tabular-nums">
                  {i + 1}
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={c.nombre}
                    placeholder="Nombre y apellido"
                    onChange={(evento) => alCambiar(i, 'nombre', evento.target.value)}
                    className="w-full rounded-lg border border-tinta-300 px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={c.whatsapp}
                    inputMode="tel"
                    placeholder="3001234567"
                    onChange={(evento) => alCambiar(i, 'whatsapp', evento.target.value)}
                    className="w-full rounded-lg border border-tinta-300 px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-500/20"
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => alQuitarFila(i)}
                    aria-label={`Quitar fila ${i + 1}`}
                    className="rounded-md p-1.5 text-tinta-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-tinta-200 p-3">
        <Button
          variante="secundario"
          tamano="sm"
          onClick={alAgregarFila}
          iconoIzquierda={<Plus className="size-4" aria-hidden />}
        >
          Añadir fila
        </Button>
      </div>
    </Card>
  );
}
