import { http } from './http';
import type { ApiRespuesta } from '@/types/api.types';
import type {
  ImagenLandingConUrl,
  LandingPublico,
  SeccionLanding,
} from '@/types/landing.types';

/** Gestión de imágenes del inicio (requiere JWT de administrador). */
export const landingService = {
  async listar(): Promise<ImagenLandingConUrl[]> {
    const { data } = await http.get<ApiRespuesta<ImagenLandingConUrl[]>>('/admin/landing');
    return data.data;
  },

  async subir(
    seccion: SeccionLanding,
    anio: number | null,
    archivo: File,
  ): Promise<ImagenLandingConUrl> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    formulario.append('seccion', seccion);
    if (anio !== null) formulario.append('anio', String(anio));

    const { data } = await http.post<ApiRespuesta<ImagenLandingConUrl>>(
      '/admin/landing',
      formulario,
      { headers: { 'Content-Type': undefined } },
    );
    return data.data;
  },

  async alternarActiva(id: string, activo: boolean): Promise<ImagenLandingConUrl> {
    const { data } = await http.patch<ApiRespuesta<ImagenLandingConUrl>>(
      `/admin/landing/${id}`,
      { activo },
    );
    return data.data;
  },

  async mover(id: string, direccion: 'subir' | 'bajar'): Promise<void> {
    await http.post(`/admin/landing/${id}/mover`, { direccion });
  },

  async eliminar(id: string): Promise<void> {
    await http.delete(`/admin/landing/${id}`);
  },
};

/** Vista pública del inicio (solo API key). */
export const landingPublicoService = {
  async inicio(): Promise<LandingPublico> {
    const { data } = await http.get<ApiRespuesta<LandingPublico>>('/catalogo/landing');
    return data.data;
  },
};
