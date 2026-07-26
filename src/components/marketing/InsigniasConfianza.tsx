import { Lock, ShieldCheck, Sparkles, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Insignia {
  icono: LucideIcon;
  titulo: string;
  detalle: string;
}

const INSIGNIAS: Insignia[] = [
  { icono: ShieldCheck, titulo: '34 años', detalle: 'de experiencia' },
  { icono: Users, titulo: 'Miles de', detalle: 'estudiantes felices' },
  { icono: Sparkles, titulo: 'Eventos', detalle: 'exclusivos' },
  { icono: Lock, titulo: 'Seguridad', detalle: 'y confianza' },
];

/**
 * Franja de confianza del área pública: cuatro sellos con icono dorado.
 * Refuerza la marca sin pedir nada al usuario.
 */
export function InsigniasConfianza() {
  return (
    <div className="rounded-2xl border border-oro-200/70 bg-linear-to-b from-oro-50/80 to-white p-4 shadow-suave">
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {INSIGNIAS.map(({ icono: Icono, titulo, detalle }) => (
          <li key={titulo} className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-oro-300 to-oro-600 text-noche-900 shadow-[0_4px_10px_-3px_rgb(189_125_28/0.5)]">
              <Icono className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold tracking-wide text-tinta-800 uppercase">
                {titulo}
              </span>
              <span className="block text-xs text-tinta-500">{detalle}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
