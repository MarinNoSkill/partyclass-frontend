import { forwardRef, useId, type ChangeEventHandler, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

// ---------------------------------------------------------------------------
// Envoltura común: etiqueta + control + mensaje de error debajo del campo.
// ---------------------------------------------------------------------------

interface PropsCampo {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
  children: ReactNode;
  className?: string;
}

function Campo({ id, etiqueta, error, ayuda, requerido, children, className }: PropsCampo) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-tinta-700">
        {etiqueta}
        {requerido && (
          <span className="ml-0.5 text-red-500" aria-hidden>
            *
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium text-red-600"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        ayuda && (
          <p id={`${id}-ayuda`} className="text-xs text-tinta-400">
            {ayuda}
          </p>
        )
      )}
    </div>
  );
}

const CLASES_CONTROL =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-tinta-900 transition-colors ' +
  'placeholder:text-tinta-400 focus:outline-none focus:ring-2 focus:ring-marca-500/25 ' +
  'disabled:cursor-not-allowed disabled:bg-tinta-50 disabled:text-tinta-400';

const CLASES_BORDE_NORMAL = 'border-tinta-300 focus:border-marca-500';
const CLASES_BORDE_ERROR = 'border-red-400 focus:border-red-500 focus:ring-red-500/20';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface PropsInput extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
  contenedorClassName?: string;
  /** Bloquea todo lo que no sea dígito (teléfonos, cédulas numéricas). */
  soloNumeros?: boolean;
  /** Opciones de autocompletado (datalist). El usuario puede escribir libre. */
  sugerencias?: readonly string[];
}

export const Input = forwardRef<HTMLInputElement, PropsInput>(function Input(
  {
    etiqueta,
    error,
    ayuda,
    requerido,
    contenedorClassName,
    soloNumeros,
    sugerencias,
    className,
    id,
    onChange,
    ...resto
  },
  ref,
) {
  const idGenerado = useId();
  const idCampo = id ?? idGenerado;
  const idLista = sugerencias ? `${idCampo}-lista` : undefined;

  // Filtra los no-dígitos ANTES de pasar el evento a react-hook-form, que lee
  // `e.target.value`. Así el campo nunca llega a mostrar letras.
  const manejarCambio: ChangeEventHandler<HTMLInputElement> = (evento) => {
    if (soloNumeros) {
      evento.target.value = evento.target.value.replace(/\D/g, '');
    }
    onChange?.(evento);
  };

  return (
    <Campo
      id={idCampo}
      etiqueta={etiqueta}
      error={error}
      ayuda={ayuda}
      requerido={requerido}
      className={contenedorClassName}
    >
      <input
        {...resto}
        ref={ref}
        id={idCampo}
        list={idLista}
        inputMode={soloNumeros ? 'numeric' : resto.inputMode}
        onChange={manejarCambio}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${idCampo}-error` : ayuda ? `${idCampo}-ayuda` : undefined}
        className={cn(
          CLASES_CONTROL,
          error ? CLASES_BORDE_ERROR : CLASES_BORDE_NORMAL,
          className,
        )}
      />
      {sugerencias && (
        <datalist id={idLista}>
          {sugerencias.map((opcion) => (
            <option key={opcion} value={opcion} />
          ))}
        </datalist>
      )}
    </Campo>
  );
});

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

export interface OpcionSelect {
  valor: string;
  etiqueta: string;
}

export interface PropsSelect extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string;
  opciones: readonly OpcionSelect[];
  error?: string;
  ayuda?: string;
  requerido?: boolean;
  placeholder?: string;
  contenedorClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, PropsSelect>(function Select(
  {
    etiqueta,
    opciones,
    error,
    ayuda,
    requerido,
    placeholder,
    contenedorClassName,
    className,
    id,
    ...resto
  },
  ref,
) {
  const idGenerado = useId();
  const idCampo = id ?? idGenerado;

  return (
    <Campo
      id={idCampo}
      etiqueta={etiqueta}
      error={error}
      ayuda={ayuda}
      requerido={requerido}
      className={contenedorClassName}
    >
      <select
        ref={ref}
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${idCampo}-error` : undefined}
        className={cn(
          CLASES_CONTROL,
          'appearance-none bg-[length:1.1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10',
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke-width=%272%27 stroke=%27%2394a3b8%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 d=%27m19.5 8.25-7.5 7.5-7.5-7.5%27/%3E%3C/svg%3E')]",
          error ? CLASES_BORDE_ERROR : CLASES_BORDE_NORMAL,
          className,
        )}
        {...resto}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </Campo>
  );
});

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------

export interface PropsTextarea extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
  contenedorClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, PropsTextarea>(function Textarea(
  { etiqueta, error, ayuda, requerido, contenedorClassName, className, id, rows = 3, ...resto },
  ref,
) {
  const idGenerado = useId();
  const idCampo = id ?? idGenerado;

  return (
    <Campo
      id={idCampo}
      etiqueta={etiqueta}
      error={error}
      ayuda={ayuda}
      requerido={requerido}
      className={contenedorClassName}
    >
      <textarea
        ref={ref}
        id={idCampo}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${idCampo}-error` : undefined}
        className={cn(
          CLASES_CONTROL,
          'resize-y',
          error ? CLASES_BORDE_ERROR : CLASES_BORDE_NORMAL,
          className,
        )}
        {...resto}
      />
    </Campo>
  );
});

// ---------------------------------------------------------------------------
// Agrupador de campos en rejilla responsive
// ---------------------------------------------------------------------------

export function GrupoCampos({
  titulo,
  children,
  columnas = 2,
}: {
  titulo?: string;
  children: ReactNode;
  columnas?: 1 | 2 | 3;
}) {
  return (
    <fieldset className="min-w-0">
      {titulo && (
        <legend className="mb-3 text-xs font-semibold tracking-wide text-tinta-400 uppercase">
          {titulo}
        </legend>
      )}
      <div
        className={cn('grid gap-4', {
          'sm:grid-cols-1': columnas === 1,
          'sm:grid-cols-2': columnas === 2,
          'sm:grid-cols-2 lg:grid-cols-3': columnas === 3,
        })}
      >
        {children}
      </div>
    </fieldset>
  );
}
