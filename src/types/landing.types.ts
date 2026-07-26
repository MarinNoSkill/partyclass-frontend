export type SeccionLanding = 'hero' | 'anio';

/** Imagen del inicio con su URL firmada, para el panel admin. */
export interface ImagenLandingConUrl {
  id: string;
  seccion: SeccionLanding;
  anio: number | null;
  ruta: string;
  nombre: string;
  mime: string;
  bytes: number;
  ancho_px: number | null;
  alto_px: number | null;
  orden: number;
  activo: boolean;
  url: string | null;
  created_at: string;
  updated_at: string;
}

/** Vista pública del inicio: URLs del hero y por año. */
export interface LandingPublico {
  hero: string[];
  anios: Record<number, string[]>;
}
