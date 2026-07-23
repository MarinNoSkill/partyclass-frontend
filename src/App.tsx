import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@/routes/AppRoutes';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ErrorApi } from '@/services/http';
import { erroresConfig } from '@/utils/config';
import { ErrorConfiguracion } from '@/pages/ErrorConfiguracion';

const clienteQuery = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (intentos, error) => {
        // No reintentar errores de cliente: el resultado no va a cambiar.
        if (error instanceof ErrorApi && error.status >= 400 && error.status < 500) {
          return false;
        }
        return intentos < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

export function App() {
  // Sin configuración válida no tiene sentido montar el router: cualquier
  // petición fallaría. Mejor decir qué falta que fallar en cascada.
  if (erroresConfig.length > 0) {
    return <ErrorConfiguracion errores={erroresConfig} />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={clienteQuery}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
