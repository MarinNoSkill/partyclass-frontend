import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type TipoToast = 'exito' | 'error' | 'info' | 'advertencia';

export interface Toast {
  id: string;
  tipo: TipoToast;
  titulo: string;
  descripcion?: string;
}

interface ValorToastContext {
  toasts: Toast[];
  mostrar: (toast: Omit<Toast, 'id'>) => void;
  exito: (titulo: string, descripcion?: string) => void;
  error: (titulo: string, descripcion?: string) => void;
  cerrar: (id: string) => void;
}

const ToastContext = createContext<ValorToastContext | null>(null);

const DURACION_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const temporizadores = useRef(new Map<string, number>());

  const cerrar = useCallback((id: string) => {
    setToasts((actuales) => actuales.filter((toast) => toast.id !== id));

    const temporizador = temporizadores.current.get(id);
    if (temporizador !== undefined) {
      window.clearTimeout(temporizador);
      temporizadores.current.delete(id);
    }
  }, []);

  const mostrar = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID();
      setToasts((actuales) => [...actuales.slice(-3), { ...toast, id }]);
      temporizadores.current.set(id, window.setTimeout(() => cerrar(id), DURACION_MS));
    },
    [cerrar],
  );

  const valor = useMemo<ValorToastContext>(
    () => ({
      toasts,
      mostrar,
      cerrar,
      exito: (titulo, descripcion) => mostrar({ tipo: 'exito', titulo, descripcion }),
      error: (titulo, descripcion) => mostrar({ tipo: 'error', titulo, descripcion }),
    }),
    [toasts, mostrar, cerrar],
  );

  return <ToastContext.Provider value={valor}>{children}</ToastContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ValorToastContext {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  return contexto;
}
