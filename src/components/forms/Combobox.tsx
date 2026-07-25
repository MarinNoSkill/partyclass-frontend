import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  opciones: readonly string[];
  placeholder?: string;
  error?: string;
  requerido?: boolean;
  disabled?: boolean;
  /** Si es `false`, solo se pueden elegir opciones de la lista (no texto libre). */
  permiteLibre?: boolean;
}

/**
 * Combobox controlado: campo de texto con un desplegable que se abre SIEMPRE
 * hacia abajo, filtrado por lo que se escribe.
 *
 * Reemplaza al `datalist` nativo (que el navegador posiciona a su antojo). El
 * desplegable es un elemento propio, con scroll, resaltado del texto que
 * coincide y navegación con teclado. Por defecto permite escribir libremente y,
 * a la vez, elegir de la lista.
 */
export function Combobox({
  etiqueta,
  valor,
  onCambio,
  opciones,
  placeholder,
  error,
  requerido,
  disabled,
  permiteLibre = true,
}: Props) {
  const id = useId();
  const contenedorRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(0);

  const consulta = valor.trim().toLowerCase();
  const filtradas = consulta
    ? opciones.filter((o) => o.toLowerCase().includes(consulta))
    : opciones;

  // Cierra al hacer clic fuera.
  useEffect(() => {
    if (!abierto) return;
    const alClicar = (evento: MouseEvent) => {
      if (!contenedorRef.current?.contains(evento.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', alClicar);
    return () => document.removeEventListener('mousedown', alClicar);
  }, [abierto]);

  // Mantiene visible la opción resaltada al navegar con el teclado.
  useEffect(() => {
    if (!abierto || !listaRef.current) return;
    const item = listaRef.current.children[resaltado] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [resaltado, abierto]);

  const elegir = (opcion: string) => {
    onCambio(opcion);
    setAbierto(false);
  };

  const alTeclear = (evento: React.KeyboardEvent) => {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      setAbierto(true);
      setResaltado((i) => Math.min(i + 1, filtradas.length - 1));
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      setResaltado((i) => Math.max(i - 1, 0));
    } else if (evento.key === 'Enter' && abierto && filtradas[resaltado]) {
      evento.preventDefault();
      elegir(filtradas[resaltado]);
    } else if (evento.key === 'Escape') {
      setAbierto(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5" ref={contenedorRef}>
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
          value={valor}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
          role="combobox"
          aria-expanded={abierto}
          aria-controls={`${id}-lista`}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            onCambio(e.target.value);
            setAbierto(true);
            setResaltado(0);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={alTeclear}
          onBlur={() => {
            // Si no se permite texto libre y lo escrito no está en la lista, se limpia.
            if (!permiteLibre && valor && !opciones.some((o) => o === valor)) onCambio('');
          }}
          className={cn(
            'w-full rounded-xl border bg-white px-3.5 py-2.5 pr-10 text-sm text-tinta-900 transition-colors',
            'placeholder:text-tinta-400 focus:outline-none focus:ring-2 focus:ring-marca-500/25',
            'disabled:cursor-not-allowed disabled:bg-tinta-50 disabled:text-tinta-400',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-tinta-300 focus:border-marca-500',
          )}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setAbierto((v) => !v)}
          aria-label="Mostrar opciones"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1 text-tinta-400 transition-colors hover:text-marca-600"
        >
          <ChevronDown
            className={cn('size-4 transition-transform', abierto && 'rotate-180')}
            aria-hidden
          />
        </button>

        {abierto && filtradas.length > 0 && (
          <ul
            id={`${id}-lista`}
            ref={listaRef}
            role="listbox"
            className="barra-scroll-fina absolute top-full left-0 z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-tinta-200 bg-white py-1 shadow-xl shadow-tinta-900/10"
          >
            {filtradas.map((opcion, indice) => {
              const seleccionada = opcion === valor;
              return (
                <li
                  key={opcion}
                  role="option"
                  aria-selected={seleccionada}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    elegir(opcion);
                  }}
                  onMouseEnter={() => setResaltado(indice)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-sm',
                    indice === resaltado ? 'bg-marca-50 text-marca-800' : 'text-tinta-700',
                  )}
                >
                  <span className="truncate">{opcion}</span>
                  {seleccionada && <Check className="size-4 shrink-0 text-marca-600" aria-hidden />}
                </li>
              );
            })}
          </ul>
        )}
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
