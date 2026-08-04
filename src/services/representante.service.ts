import { http } from './http';
import type { ApiRespuesta } from '@/types/api.types';
import type { EstudianteFormulario, AcudienteFormulario } from '@/interfaces/formularios';
import type { RolAcudiente } from '@/types/dominio.types';

export interface CompaneroInput {
  nombre: string;
  whatsapp: string;
}

export interface RegistroRepresentantePayload {
  estudiante: EstudianteFormulario;
  acudientes: Array<AcudienteFormulario & { rol: RolAcudiente }>;
  firmas: Array<{ rol: RolAcudiente; imagenBase64: string }>;
  companeros: CompaneroInput[];
}

export interface RepresentanteCreado {
  reservaId: string;
  codigo: string;
  /** true si se envió sin todas las firmas (convenio con marca «PENDIENTE»). */
  pendiente: boolean;
}

/** Módulo público de representantes (solo requiere API key). */
export const representanteService = {
  async validarDocumento(documento: string): Promise<boolean> {
    const { data } = await http.post<ApiRespuesta<{ valido: boolean }>>(
      '/representante/validar-documento',
      { documento },
    );
    return data.data.valido;
  },

  async registrar(payload: RegistroRepresentantePayload): Promise<RepresentanteCreado> {
    const { data } = await http.post<ApiRespuesta<RepresentanteCreado>>(
      '/representante',
      payload,
    );
    return data.data;
  },

  async descargarConvenio(reservaId: string): Promise<Blob> {
    const { data } = await http.get<Blob>(`/representante/${reservaId}/convenio`, {
      responseType: 'blob',
    });
    return data;
  },

  async descargarExcelCompaneros(reservaId: string): Promise<Blob> {
    const { data } = await http.get<Blob>(`/representante/${reservaId}/companeros-excel`, {
      responseType: 'blob',
    });
    return data;
  },
};

/** Dispara la descarga de un blob con el nombre dado. */
export function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
