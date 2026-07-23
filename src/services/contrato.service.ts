import { http } from './http';

export const contratoService = {
  /**
   * Descarga el PDF como blob a través del backend.
   * Se usa para previsualizar e imprimir sin exponer la ruta de Storage.
   */
  async descargarBlob(reservaId: string): Promise<Blob> {
    const { data } = await http.get<Blob>(`/reservas/${reservaId}/contrato/archivo`, {
      responseType: 'blob',
    });
    return data;
  },
};
