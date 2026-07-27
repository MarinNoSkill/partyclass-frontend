/** Un documento con los años en que está bloqueado (o «todos»). */
export interface DocumentoBloqueadoAgrupado {
  numero_documento: string;
  anios: number[];
  todos: boolean;
}

export interface BloquearDocumentosDto {
  documentos: string[];
  /** Años concretos, o null para «todos los años». */
  anios: number[] | null;
}
