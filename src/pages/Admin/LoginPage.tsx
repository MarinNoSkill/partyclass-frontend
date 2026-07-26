import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/forms/FormField';
import { useAuth } from '@/contexts/AuthContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { config } from '@/utils/config';

interface EstadoNavegacion {
  desde?: string;
}

export function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const { login, autenticado, cargando } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const destino = (ubicacion.state as EstadoNavegacion | null)?.desde ?? '/admin/registros';

  if (!cargando && autenticado) {
    return <Navigate to={destino} replace />;
  }

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError(null);

    if (usuario.trim() === '' || password === '') {
      setError('Completa el usuario y la contraseña.');
      return;
    }

    setEnviando(true);
    try {
      await login(usuario.trim(), password);
      navegar(destino, { replace: true });
    } catch (fallo) {
      setError(mensajeDeError(fallo));
      setPassword('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fondo-fiesta grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/logo.webp"
            alt="PartyClass"
            className="h-20 w-auto drop-shadow-[0_4px_16px_rgb(0_0_0/0.45)]"
          />
          <h1 className="mt-4 font-display text-xl font-bold text-white">
            Panel de administración
          </h1>
          <p className="mt-1 text-sm text-white/60">
            <span className="font-semibold text-oro-300">{config.appName}</span> · acceso
            restringido
          </p>
        </div>

        <form
          onSubmit={enviar}
          noValidate
          className="rounded-2xl border border-tinta-700 bg-white p-6 shadow-2xl sm:p-8"
        >
          <div className="space-y-4">
            <Input
              etiqueta="Usuario"
              autoComplete="username"
              autoFocus
              value={usuario}
              onChange={(evento) => setUsuario(evento.target.value)}
              disabled={enviando}
            />

            <div className="relative">
              <Input
                etiqueta="Contraseña"
                type={verPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                disabled={enviando}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setVerPassword((visible) => !visible)}
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute top-8 right-2 rounded-lg p-1.5 text-tinta-400 transition-colors hover:bg-tinta-100 hover:text-tinta-700"
              >
                {verPassword ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            anchoCompleto
            className="mt-6"
            cargando={enviando}
            iconoIzquierda={<Lock className="size-4" aria-hidden />}
          >
            Iniciar sesión
          </Button>

          <p className="mt-4 text-center text-xs text-tinta-400">
            La sesión se cierra automáticamente a las 8 horas y al cerrar la pestaña.
          </p>
        </form>
      </div>
    </div>
  );
}
