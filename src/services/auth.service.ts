import { http } from './http';
import type { ApiRespuesta } from '@/types/api.types';
import type { ReservaAuditoria } from '@/types/dominio.types';

export interface SesionAdmin {
  token: string;
  usuario: string;
  /** Marca de tiempo Unix (segundos) de expiración del token. */
  expiraEn: number;
}

const CLAVE_ALMACENAMIENTO = 'partyclass.sesion.admin';

/**
 * Persistencia de la sesión en `sessionStorage`, no en `localStorage`:
 * al cerrar la pestaña la sesión desaparece. En un equipo compartido de
 * oficina eso importa más que la comodidad de no volver a entrar.
 */
export const almacenSesion = {
  leer(): SesionAdmin | null {
    try {
      const crudo = sessionStorage.getItem(CLAVE_ALMACENAMIENTO);
      if (!crudo) return null;

      const sesion = JSON.parse(crudo) as SesionAdmin;

      // Descarta tokens ya caducados sin ir al servidor.
      if (sesion.expiraEn * 1000 <= Date.now()) {
        sessionStorage.removeItem(CLAVE_ALMACENAMIENTO);
        return null;
      }

      return sesion;
    } catch {
      return null;
    }
  },

  guardar(sesion: SesionAdmin): void {
    sessionStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(sesion));
  },

  borrar(): void {
    sessionStorage.removeItem(CLAVE_ALMACENAMIENTO);
  },
};

export const authService = {
  async login(usuario: string, password: string): Promise<SesionAdmin> {
    const { data } = await http.post<ApiRespuesta<SesionAdmin>>('/admin/login', {
      usuario,
      password,
    });
    return data.data;
  },

  async verificarSesion(): Promise<{ usuario: string | null }> {
    const { data } = await http.get<ApiRespuesta<{ usuario: string | null }>>('/admin/yo');
    return data.data;
  },
};

export const auditoriaService = {
  async detalle(reservaId: string): Promise<ReservaAuditoria> {
    const { data } = await http.get<ApiRespuesta<ReservaAuditoria>>(
      `/admin/registros/${reservaId}`,
    );
    return data.data;
  },
};
