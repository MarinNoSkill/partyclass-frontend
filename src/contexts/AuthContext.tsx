import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  almacenSesion,
  authService,
  type SesionAdmin,
} from '@/services/auth.service';
import { establecerToken, registrarManejadorSesionExpirada } from '@/services/http';

interface ValorAuthContext {
  sesion: SesionAdmin | null;
  autenticado: boolean;
  /** `true` mientras se restaura la sesión guardada al arrancar. */
  cargando: boolean;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<ValorAuthContext | null>(null);

/** Cierra la sesión 30 s antes de que el token caduque, para evitar un 401. */
const MARGEN_EXPIRACION_MS = 30_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionAdmin | null>(null);
  const [cargando, setCargando] = useState(true);
  const temporizador = useRef<number | null>(null);

  const logout = useCallback(() => {
    if (temporizador.current !== null) {
      window.clearTimeout(temporizador.current);
      temporizador.current = null;
    }

    almacenSesion.borrar();
    establecerToken(null);
    setSesion(null);
  }, []);

  /** Registra el token en Axios y programa el cierre automático. */
  const activarSesion = useCallback(
    (nueva: SesionAdmin) => {
      establecerToken(nueva.token);
      almacenSesion.guardar(nueva);
      setSesion(nueva);

      if (temporizador.current !== null) window.clearTimeout(temporizador.current);

      const restanteMs = nueva.expiraEn * 1000 - Date.now() - MARGEN_EXPIRACION_MS;
      if (restanteMs > 0) {
        temporizador.current = window.setTimeout(logout, restanteMs);
      }
    },
    [logout],
  );

  // Restaura la sesión guardada y la valida contra el servidor.
  useEffect(() => {
    const guardada = almacenSesion.leer();

    if (!guardada) {
      setCargando(false);
      return;
    }

    establecerToken(guardada.token);

    authService
      .verificarSesion()
      .then(() => activarSesion(guardada))
      .catch(() => logout())
      .finally(() => setCargando(false));
  }, [activarSesion, logout]);

  // El interceptor avisa cuando el servidor rechaza el token.
  useEffect(() => {
    registrarManejadorSesionExpirada(logout);
    return () => registrarManejadorSesionExpirada(null);
  }, [logout]);

  const login = useCallback(
    async (usuario: string, password: string) => {
      const nueva = await authService.login(usuario, password);
      activarSesion(nueva);
    },
    [activarSesion],
  );

  const valor = useMemo<ValorAuthContext>(
    () => ({ sesion, autenticado: sesion !== null, cargando, login, logout }),
    [sesion, cargando, login, logout],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): ValorAuthContext {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return contexto;
}
