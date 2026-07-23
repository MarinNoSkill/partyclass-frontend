import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface Estado {
  error: Error | null;
}

/**
 * Última red de seguridad de la UI. Captura errores de render que ningún
 * try/catch alcanzaría y evita la pantalla en blanco.
 */
export class ErrorBoundary extends Component<Props, Estado> {
  state: Estado = { error: null };

  static getDerivedStateFromError(error: Error): Estado {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error no capturado en la interfaz', error, info.componentStack);
  }

  private reiniciar = (): void => {
    this.setState({ error: null });
    window.location.assign('/');
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="grid min-h-dvh place-items-center bg-tinta-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-tinta-200 bg-white p-8 text-center shadow-lg">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600">
            <AlertOctagon className="size-6" aria-hidden />
          </span>

          <h1 className="mt-4 text-lg font-semibold text-tinta-900">Algo salió mal</h1>
          <p className="mt-2 text-sm text-tinta-500">
            La aplicación encontró un error inesperado. Puedes volver al inicio e intentarlo de
            nuevo.
          </p>

          <p className="mt-3 rounded-lg bg-tinta-50 px-3 py-2 text-left text-xs break-words text-tinta-500">
            {error.message}
          </p>

          <button
            type="button"
            onClick={this.reiniciar}
            className="mt-6 h-11 w-full rounded-xl bg-marca-600 text-sm font-medium text-white transition-colors hover:bg-marca-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }
}
