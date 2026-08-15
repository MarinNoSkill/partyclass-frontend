import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mensajeDeError } from '@/hooks/useMensajeError';
import { config } from '@/utils/config';

interface EstadoNavegacion {
  desde?: string;
}

const FONDO =
  'linear-gradient(to bottom, rgba(8,6,4,0.6), rgba(8,6,4,0.55) 50%, rgba(8,6,4,0.85)), url("/Imagen%20de%20fondo.png")';

const CLASE_CAMPO =
  'w-full rounded-xl border border-oro-500/30 bg-white/5 px-3.5 py-2.5 text-sm text-white ' +
  'placeholder:text-white/35 transition-colors focus:border-oro-400 focus:outline-none ' +
  'focus:ring-2 focus:ring-oro-500/30 disabled:cursor-not-allowed disabled:opacity-60';

export function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const { login, autenticado, cargando } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const destino = (ubicacion.state as EstadoNavegacion | null)?.desde ?? '/admin';

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
    <div
      className="grid min-h-dvh place-items-center overflow-x-hidden bg-noche-950 bg-cover bg-center px-4 py-10 text-white"
      style={{ backgroundImage: FONDO }}
    >
      <div className="w-full max-w-md">
        {/* Marca */}
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/logopartyclass.png"
            alt="PartyClass"
            className="h-16 w-auto drop-shadow-[0_4px_16px_rgba(230,183,61,0.4)] sm:h-20"
          />
          <p className="mt-2 font-display text-xs font-semibold tracking-[0.35em] text-oro-200 uppercase">
            Panel administrativo
          </p>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-oro-400">
            <span className="h-px w-8 bg-linear-to-r from-transparent to-oro-500/70" />
            <span className="text-[10px]">★ ★ ★ ★ ★</span>
            <span className="h-px w-8 bg-linear-to-l from-transparent to-oro-500/70" />
          </div>
        </div>

        {/* Tarjeta */}
        <form
          onSubmit={enviar}
          noValidate
          className="rounded-2xl border border-oro-500/30 bg-black/55 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md sm:p-8"
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-oro-400/60 text-oro-300">
              <Lock className="size-5" aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-lg font-bold text-white">Iniciar sesión</h1>
              <p className="text-xs text-white/50">
                <span className="text-oro-300">{config.appName}</span> · acceso restringido
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-oro-200">Usuario</span>
              <input
                autoComplete="username"
                autoFocus
                value={usuario}
                onChange={(evento) => setUsuario(evento.target.value)}
                disabled={enviando}
                className={CLASE_CAMPO}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-oro-200">Contraseña</span>
              <div className="relative">
                <input
                  type={verPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                  disabled={enviando}
                  className={`${CLASE_CAMPO} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((visible) => !visible)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-oro-300/70 transition-colors hover:bg-white/10 hover:text-oro-200"
                >
                  {verPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
            </label>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-b from-oro-300 to-oro-500 px-4 py-2.5 text-sm font-bold text-noche-950 shadow-[0_10px_30px_-10px_rgba(217,158,37,0.6)] transition-all hover:from-oro-200 hover:to-oro-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Lock className="size-4" aria-hidden />
            )}
            Iniciar sesión
          </button>

          <p className="mt-4 text-center text-xs text-white/40">
            La sesión se cierra automáticamente a las 8 horas y al cerrar la pestaña.
          </p>
        </form>
      </div>
    </div>
  );
}
