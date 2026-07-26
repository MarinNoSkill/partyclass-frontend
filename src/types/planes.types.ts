export interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  anio: number;
  /** numeric(12,2) de Postgres: llega como string para no perder precisión. */
  valor: string;
  plantilla_contrato: string;
  activo: boolean;

  /** Posición dentro de su año (menor = se muestra primero). */
  orden: number;

  /** Cuántas boletas de sorteo emite el plan. Define cuántos números se asignan. */
  numero_boletas: number;

  /** Si es personalizado, solo se accede por su enlace, no por el selector público. */
  personalizado: boolean;
  /** Token del enlace de inscripción. Solo en los personalizados. */
  token: string | null;

  imagen_ruta: string | null;
  imagen_nombre: string | null;
  imagen_mime: string | null;
  imagen_bytes: number | null;
  imagen_ancho_px: number | null;
  imagen_alto_px: number | null;

  boleta_ruta: string | null;
  boleta_nombre: string | null;
  boleta_mime: string | null;
  boleta_bytes: number | null;
  boleta_ancho_px: number | null;
  boleta_alto_px: number | null;

  /** Imagen comercial que ve el estudiante al elegir el plan. Opcional. */
  presentacion_ruta: string | null;
  presentacion_nombre: string | null;
  presentacion_mime: string | null;
  presentacion_bytes: number | null;
  presentacion_ancho_px: number | null;
  presentacion_alto_px: number | null;

  created_at: string;
  updated_at: string;
}

export interface PlanConImagen extends Plan {
  total_convenios: number;
  total_reservas: number;
  /** Enlaces temporales a las imágenes. Caducan a los 5 minutos. */
  imagenUrl: string | null;
  boletaUrl: string | null;
  presentacionUrl: string | null;
  /** `false` cuando ya hay convenios emitidos bajo este plan. */
  eliminable: boolean;
}

export interface AnioDisponible {
  anio: number;
  total_planes: number;
}

export interface CrearPlanDto {
  nombre: string;
  anio: number;
  valor: number;
  numeroBoletas?: number;
  personalizado?: boolean;
  descripcion?: string;
  activo?: boolean;
  orden?: number;
}

export type ActualizarPlanDto = Partial<CrearPlanDto>;

export interface FiltrosPlanes {
  anio?: number;
  activo?: boolean;
  buscar?: string;
}
