import { useEffect, useId, useState } from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  etiqueta: string;
  /** Valor en ISO (YYYY-MM-DD) o cadena vacía. */
  valorIso: string;
  onCambio: (iso: string) => void;
  error?: string;
  requerido?: boolean;
  disabled?: boolean;
}

/** ISO (2006-05-01) -> texto visible (01/05/2006). */
function isoATexto(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** '01/05/2006' -> '2006-05-01' solo si es una fecha real; si no, ''. */
function textoAIso(texto: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return '';
  const [, dia, mes, anio] = m;
  const d = Number(dia);
  const mesN = Number(mes);
  const a = Number(anio);
  if (mesN < 1 || mesN > 12 || d < 1 || d > 31 || a < 1900) return '';

  const fecha = new Date(a, mesN - 1, d);
  const valida =
    fecha.getFullYear() === a && fecha.getMonth() === mesN - 1 && fecha.getDate() === d;
  return valida ? `${anio}-${mes}-${dia}` : '';
}

/** Inserta las barras al escribir: '01052006' -> '01/05/2006'. */
function enmascarar(entrada: string): string {
  const d = entrada.replace(/\D/g, '').slice(0, 8);
  const partes = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean);
  return partes.join('/');
}

/**
 * Campo de fecha ESCRIBIBLE con máscara DD/MM/AAAA.
 *
 * A diferencia de `<input type="date">` (que en algunos navegadores obliga a
 * usar el calendario), aquí se teclea directo. Incluye un selector nativo
 * opcional en el icono para quien prefiera el calendario. Guarda siempre en
 * ISO, que es lo que valida el esquema.
 */
export function InputFecha({
  etiqueta,
  valorIso,
  onCambio,
  error,
  requerido,
  disabled,
}: Props) {
  const id = useId();
  const [texto, setTexto] = useState(() => isoATexto(valorIso));

  // Se resincroniza cuando el formulario se resetea desde fuera.
  useEffect(() => {
    setTexto(isoATexto(valorIso));
  }, [valorIso]);

  const alEscribir = (bruto: string) => {
    const visible = enmascarar(bruto);
    setTexto(visible);
    onCambio(textoAIso(visible)); // '' hasta que la fecha esté completa y sea válida
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-tinta-700">
        {etiqueta}
        {requerido && (
          <span className="ml-0.5 text-red-500" aria-hidden>
            *
          </span>
        )}
      </label>

      <div className="relative">
        <input
          id={id}
          value={texto}
          inputMode="numeric"
          placeholder="DD/MM/AAAA"
          autoComplete="off"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          onChange={(evento) => alEscribir(evento.target.value)}
          className={cn(
            'w-full rounded-xl border bg-white px-3.5 py-2.5 pr-11 text-sm text-tinta-900 transition-colors',
            'placeholder:text-tinta-400 focus:outline-none focus:ring-2 focus:ring-marca-500/25',
            'disabled:cursor-not-allowed disabled:bg-tinta-50 disabled:text-tinta-400',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-tinta-300 focus:border-marca-500',
          )}
        />

        {/* Selector nativo oculto sobre el icono, para quien prefiera el calendario. */}
        <label className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-tinta-400 transition-colors hover:bg-tinta-100 hover:text-marca-600">
          <Calendar className="size-4" aria-hidden />
          <input
            type="date"
            value={valorIso}
            disabled={disabled}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(evento) => alEscribir(isoATexto(evento.target.value))}
            className="absolute inset-0 cursor-pointer opacity-0"
            tabIndex={-1}
            aria-label={`Elegir ${etiqueta.toLowerCase()} en el calendario`}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
