import { http } from './http';
import type { ApiRespuesta } from '@/types/api.types';

export interface AlumnoAutorizacion {
  id: string;
  tipo_documento: string | null;
  numero_documento: string;
  primer_nombre: string | null;
  segundo_nombre: string | null;
  primer_apellido: string | null;
  segundo_apellido: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  grado: string | null;
  grupo: string | null;
  institucion: string | null;
  telefono: string | null;
  email: string | null;
  eps: string | null;
  representante_grupo: string | null;
  asesor: string | null;
  direccion: string | null;
  ciudad: string | null;
  datos_completos: boolean;
  origen: 'carga' | 'registro';
}

export type DatosAlumno = Partial<
  Pick<
    AlumnoAutorizacion,
    | 'tipo_documento'
    | 'primer_nombre'
    | 'segundo_nombre'
    | 'primer_apellido'
    | 'segundo_apellido'
    | 'fecha_nacimiento'
    | 'genero'
    | 'grado'
    | 'grupo'
    | 'institucion'
    | 'telefono'
    | 'email'
    | 'eps'
    | 'representante_grupo'
    | 'asesor'
    | 'direccion'
    | 'ciudad'
  >
>;

interface EstadoDocumento {
  permitido: boolean;
  existe: boolean;
  tieneCorreo: boolean;
  correoEnmascarado?: string;
}

interface Ingreso {
  token: string;
  alumno: AlumnoAutorizacion;
  faltanDatos: boolean;
}

export interface Requisito {
  tipo: string;
  etiqueta: string;
  subido: boolean;
}

export const autorizacionesService = {
  // --- Público -------------------------------------------------------------
  async validarDocumento(documento: string): Promise<EstadoDocumento> {
    const { data } = await http.post<ApiRespuesta<EstadoDocumento>>(
      '/autorizaciones/validar-documento',
      { documento },
    );
    return data.data;
  },
  async enviarCodigo(documento: string): Promise<{ correoEnmascarado: string }> {
    const { data } = await http.post<ApiRespuesta<{ correoEnmascarado: string }>>(
      '/autorizaciones/enviar-codigo',
      { documento },
    );
    return data.data;
  },
  async ingresar(documento: string): Promise<Ingreso> {
    const { data } = await http.post<ApiRespuesta<Ingreso>>('/autorizaciones/ingresar', {
      documento,
    });
    return data.data;
  },
  async confirmarCodigo(documento: string, codigo: string): Promise<Ingreso> {
    const { data } = await http.post<ApiRespuesta<Ingreso>>(
      '/autorizaciones/confirmar-codigo',
      { documento, codigo },
    );
    return data.data;
  },
  async completar(token: string, datos: DatosAlumno): Promise<AlumnoAutorizacion> {
    const { data } = await http.post<ApiRespuesta<AlumnoAutorizacion>>(
      '/autorizaciones/completar',
      { token, datos },
    );
    return data.data;
  },
  async estadoDocumento(token: string): Promise<{ disponible: boolean; motivo?: string }> {
    const { data } = await http.post<ApiRespuesta<{ disponible: boolean; motivo?: string }>>(
      '/autorizaciones/documento-estado',
      { token },
    );
    return data.data;
  },
  async documentoBlob(token: string): Promise<Blob> {
    const { data } = await http.post('/autorizaciones/documento', { token }, {
      responseType: 'blob',
    });
    return data as Blob;
  },
  async requisitos(token: string): Promise<Requisito[]> {
    const { data } = await http.post<ApiRespuesta<Requisito[]>>('/autorizaciones/requisitos', {
      token,
    });
    return data.data;
  },
  async cargar(token: string, tipo: string, archivo: File): Promise<void> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    formulario.append('token', token);
    formulario.append('tipo', tipo);
    await http.post('/autorizaciones/cargar', formulario, {
      headers: { 'Content-Type': undefined },
    });
  },

  // --- Admin: documentos permitidos ---------------------------------------
  async listarPermitidos(): Promise<string[]> {
    const { data } = await http.get<ApiRespuesta<string[]>>('/admin/autorizaciones/permitidos');
    return data.data;
  },
  async agregarPermitidos(documentos: string[]): Promise<string[]> {
    const { data } = await http.post<ApiRespuesta<string[]>>(
      '/admin/autorizaciones/permitidos',
      { documentos },
    );
    return data.data;
  },
  async eliminarPermitido(documento: string): Promise<string[]> {
    const { data } = await http.delete<ApiRespuesta<string[]>>(
      `/admin/autorizaciones/permitidos/${encodeURIComponent(documento)}`,
    );
    return data.data;
  },
  async cargarPermitidosExcel(archivo: File): Promise<{ encontrados: number; lista: string[] }> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    const { data } = await http.post<ApiRespuesta<{ encontrados: number; lista: string[] }>>(
      '/admin/autorizaciones/permitidos/excel',
      formulario,
      { headers: { 'Content-Type': undefined } },
    );
    return data.data;
  },

  // --- Admin: alumnos no registrados --------------------------------------
  async listarAlumnos(): Promise<AlumnoAutorizacion[]> {
    const { data } = await http.get<ApiRespuesta<AlumnoAutorizacion[]>>(
      '/admin/autorizaciones/alumnos',
    );
    return data.data;
  },
  async cargarAlumnosExcel(archivo: File): Promise<{ procesados: number; incompletos: number }> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    const { data } = await http.post<ApiRespuesta<{ procesados: number; incompletos: number }>>(
      '/admin/autorizaciones/alumnos/excel',
      formulario,
      { headers: { 'Content-Type': undefined } },
    );
    return data.data;
  },

  // --- Admin: configuración de contratos por plan -------------------------
  async obtenerConfig(planId: string): Promise<PlanConfig> {
    const { data } = await http.get<ApiRespuesta<PlanConfig>>(
      `/admin/autorizaciones/config/${planId}`,
    );
    return data.data;
  },
  async subirPlantilla(planId: string, archivo: File): Promise<PlanConfig> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    const { data } = await http.post<ApiRespuesta<PlanConfig>>(
      `/admin/autorizaciones/config/${planId}/plantilla`,
      formulario,
      { headers: { 'Content-Type': undefined } },
    );
    return data.data;
  },
  async eliminarPlantilla(planId: string): Promise<PlanConfig> {
    const { data } = await http.delete<ApiRespuesta<PlanConfig>>(
      `/admin/autorizaciones/config/${planId}/plantilla`,
    );
    return data.data;
  },
  async agregarContrato(planId: string, etiqueta: string): Promise<ContratoRequerido[]> {
    const { data } = await http.post<ApiRespuesta<ContratoRequerido[]>>(
      `/admin/autorizaciones/config/${planId}/contratos`,
      { etiqueta },
    );
    return data.data;
  },
  async eliminarContrato(id: string): Promise<void> {
    await http.delete(`/admin/autorizaciones/config/contratos/${id}`);
  },
};

export interface ContratoRequerido {
  id: string;
  plan_id: string;
  clave: string;
  etiqueta: string;
  orden: number;
}

export interface PlanConfig {
  tienePlantilla: boolean;
  urlPlantilla?: string;
  contratos: ContratoRequerido[];
}
