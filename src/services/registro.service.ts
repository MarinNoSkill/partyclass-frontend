import { http } from './http';
import type { ApiRespuesta } from '@/types/api.types';
import type { RolAcudiente } from '@/types/dominio.types';
import type { EstudianteFormulario, AcudienteFormulario } from '@/interfaces/formularios';

export interface RegistroCompletoPayload {
  plan_id: string;
  evento?: string | null;
  observaciones?: string | null;
  estudiante: EstudianteFormulario;
  acudientes: Array<AcudienteFormulario & { rol: RolAcudiente }>;
  firmas: Array<{ rol: RolAcudiente; imagenBase64: string }>;
}

export interface RegistroCreado {
  id: string;
  codigo: string;
  /** Uno por boleta del plan. */
  numerosConvenio: string[];
  contratoId: string;
  /** true si se continuó sin todas las firmas: convenio con marca «PENDIENTE». */
  pendiente?: boolean;
}

export interface RegistroEliminado {
  codigo: string;
  /** Números que vuelven al pool. Vacío si no llegaron a asignarse. */
  numerosLiberados: string[];
}

export const registroService = {
  /**
   * Alta completa en un único envío. No existen borradores: hasta esta
   * llamada, nada del registro ha tocado el servidor.
   */
  async crear(payload: RegistroCompletoPayload): Promise<RegistroCreado> {
    const { data } = await http.post<ApiRespuesta<RegistroCreado>>('/registros', payload);
    return data.data;
  },

  /**
   * Rehace el convenio con la plantilla y las coordenadas actuales.
   *
   * Conserva el número de sorteo: es el mismo convenio, redibujado. Sirve para
   * aplicar un ajuste de posición o una plantilla corregida a documentos ya
   * emitidos, sin tener que rehacer el registro.
   */
  async regenerarConvenio(id: string): Promise<void> {
    await http.post(`/admin/registros/${id}/convenio`);
  },

  /** Descarga el Excel con todos los registros. */
  async exportarExcel(): Promise<Blob> {
    const { data } = await http.get<Blob>('/admin/registros/exportar', {
      responseType: 'blob',
    });
    return data;
  },

  /** Borrado desde el panel. Libera el número de sorteo asignado. */
  async eliminar(id: string): Promise<RegistroEliminado> {
    const { data } = await http.delete<ApiRespuesta<RegistroEliminado>>(
      `/admin/registros/${id}`,
    );
    return data.data;
  },
};
