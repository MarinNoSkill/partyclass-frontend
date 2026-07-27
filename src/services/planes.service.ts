import { http } from './http';
import type { ApiRespuesta } from '@/types/api.types';
import type {
  ActualizarPlanDto,
  AnioDisponible,
  CrearPlanDto,
  FiltrosPlanes,
  PlanConImagen,
} from '@/types/planes.types';

/** Administración de planes. Todas las rutas exigen JWT de administrador. */
export const planesService = {
  async listar(filtros: FiltrosPlanes = {}): Promise<PlanConImagen[]> {
    const { data } = await http.get<ApiRespuesta<PlanConImagen[]>>('/admin/planes', {
      params: filtros,
    });
    return data.data;
  },

  async obtener(id: string): Promise<PlanConImagen> {
    const { data } = await http.get<ApiRespuesta<PlanConImagen>>(`/admin/planes/${id}`);
    return data.data;
  },

  async crear(datos: CrearPlanDto): Promise<PlanConImagen> {
    const { data } = await http.post<ApiRespuesta<PlanConImagen>>('/admin/planes', datos);
    return data.data;
  },

  async actualizar(id: string, datos: ActualizarPlanDto): Promise<PlanConImagen> {
    const { data } = await http.patch<ApiRespuesta<PlanConImagen>>(
      `/admin/planes/${id}`,
      datos,
    );
    return data.data;
  },

  async eliminar(id: string): Promise<void> {
    await http.delete(`/admin/planes/${id}`);
  },

  /** Sube o reemplaza la plantilla del convenio. */
  async subirPlantilla(id: string, archivo: File): Promise<PlanConImagen> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);

    const { data } = await http.put<ApiRespuesta<PlanConImagen>>(
      `/admin/planes/${id}/plantilla`,
      formulario,
      // No se fija Content-Type a mano: el navegador debe añadir el boundary
      // del multipart, y ponerlo manualmente lo rompe.
      { headers: { 'Content-Type': undefined } },
    );
    return data.data;
  },

  async eliminarPlantilla(id: string): Promise<PlanConImagen> {
    const { data } = await http.delete<ApiRespuesta<PlanConImagen>>(
      `/admin/planes/${id}/plantilla`,
    );
    return data.data;
  },

  /** Sube o reemplaza la imagen de la boleta. */
  async subirBoleta(id: string, archivo: File): Promise<PlanConImagen> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);

    const { data } = await http.put<ApiRespuesta<PlanConImagen>>(
      `/admin/planes/${id}/boleta`,
      formulario,
      { headers: { 'Content-Type': undefined } },
    );
    return data.data;
  },

  async eliminarBoleta(id: string): Promise<PlanConImagen> {
    const { data } = await http.delete<ApiRespuesta<PlanConImagen>>(
      `/admin/planes/${id}/boleta`,
    );
    return data.data;
  },

  /** Sube o reemplaza la imagen de presentación (la que ve el estudiante). */
  async subirPresentacion(id: string, archivo: File): Promise<PlanConImagen> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);

    const { data } = await http.put<ApiRespuesta<PlanConImagen>>(
      `/admin/planes/${id}/presentacion`,
      formulario,
      { headers: { 'Content-Type': undefined } },
    );
    return data.data;
  },

  async eliminarPresentacion(id: string): Promise<PlanConImagen> {
    const { data } = await http.delete<ApiRespuesta<PlanConImagen>>(
      `/admin/planes/${id}/presentacion`,
    );
    return data.data;
  },

  // --- Documentos autorizados (planes personalizados) ---------------------

  async listarDocumentos(id: string): Promise<string[]> {
    const { data } = await http.get<ApiRespuesta<string[]>>(`/admin/planes/${id}/documentos`);
    return data.data;
  },

  async agregarDocumentos(id: string, documentos: string[]): Promise<string[]> {
    const { data } = await http.post<ApiRespuesta<string[]>>(
      `/admin/planes/${id}/documentos`,
      { documentos },
    );
    return data.data;
  },

  async eliminarDocumento(id: string, documento: string): Promise<string[]> {
    const { data } = await http.delete<ApiRespuesta<string[]>>(
      `/admin/planes/${id}/documentos/${encodeURIComponent(documento)}`,
    );
    return data.data;
  },
};

/** Catálogo del wizard. Solo requiere API key, no sesión de administrador. */
export const catalogoService = {
  async anios(): Promise<AnioDisponible[]> {
    const { data } = await http.get<ApiRespuesta<AnioDisponible[]>>('/catalogo/anios');
    return data.data;
  },

  async planesDelAnio(anio: number): Promise<PlanConImagen[]> {
    const { data } = await http.get<ApiRespuesta<PlanConImagen[]>>(
      `/catalogo/anios/${anio}/planes`,
    );
    return data.data;
  },

  /** Plan de un enlace de inscripción personalizado. */
  async planPorToken(token: string): Promise<PlanConImagen> {
    const { data } = await http.get<ApiRespuesta<PlanConImagen>>(`/catalogo/plan/${token}`);
    return data.data;
  },

  /** Valida si un documento puede diligenciar el plan del enlace. */
  async validarDocumentoToken(token: string, documento: string): Promise<boolean> {
    const { data } = await http.post<ApiRespuesta<{ valido: boolean }>>(
      `/catalogo/plan/${token}/validar-documento`,
      { documento },
    );
    return data.data.valido;
  },

  /** ¿El documento ya tiene un registro, o está bloqueado para ese año? */
  async documentoRegistrado(numero: string, anio?: number): Promise<boolean> {
    const { data } = await http.get<ApiRespuesta<{ registrado: boolean }>>(
      `/catalogo/documento/${encodeURIComponent(numero)}`,
      { params: anio !== undefined ? { anio } : undefined },
    );
    return data.data.registrado;
  },

  /** ¿El correo ya está registrado (estudiante o acudiente)? */
  async correoRegistrado(correo: string): Promise<boolean> {
    const { data } = await http.post<ApiRespuesta<{ registrado: boolean }>>(
      '/catalogo/correo',
      { correo },
    );
    return data.data.registrado;
  },

  /** Número de contacto de soporte configurado. */
  async contacto(): Promise<string | null> {
    const { data } = await http.get<ApiRespuesta<{ contacto: string | null }>>(
      '/catalogo/contacto',
    );
    return data.data.contacto;
  },
};
