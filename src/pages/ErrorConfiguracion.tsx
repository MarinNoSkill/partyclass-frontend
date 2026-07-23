import { AlertTriangle } from 'lucide-react';

/**
 * Pantalla que sustituye a la página en blanco cuando faltan variables de
 * entorno. Se renderiza sin depender de nada más que React.
 */
export function ErrorConfiguracion({ errores }: { errores: readonly string[] }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-tinta-50 px-6 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-tinta-200 bg-white p-8 shadow-lg">
        <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle className="size-6" aria-hidden />
        </span>

        <h1 className="mt-4 text-lg font-semibold text-tinta-900">
          Falta configurar el entorno
        </h1>
        <p className="mt-2 text-sm text-tinta-500">
          La aplicación no puede arrancar porque el archivo <code>.env</code> del frontend está
          incompleto.
        </p>

        <ul className="mt-4 space-y-1.5">
          {errores.map((error) => (
            <li
              key={error}
              className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"
            >
              {error}
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-xl bg-tinta-900 p-4">
          <p className="mb-2 text-xs font-medium text-tinta-400">
            Crea <code>partyclass-frontend/.env</code> con:
          </p>
          <pre className="overflow-x-auto text-xs leading-relaxed text-tinta-100">
{`VITE_API_URL=http://localhost:4000/api/v1
VITE_API_KEY=<la misma API_KEY del backend>
VITE_APP_NAME=PartyClass`}
          </pre>
        </div>

        <p className="mt-4 text-xs text-tinta-400">
          Después de crear o modificar el <code>.env</code>, reinicia
          <code className="mx-1">npm run dev</code>: Vite solo lee las variables al arrancar.
        </p>
      </div>
    </div>
  );
}
