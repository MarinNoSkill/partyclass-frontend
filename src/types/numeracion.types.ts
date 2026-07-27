export type EstadoNumero = 'DISPONIBLE' | 'ASIGNADO';

/** Fila de `v_numeracion_convenios`. */
export interface NumeracionVista {
  id: string;
  numero: number;
  numero_formateado: string;
  estado: EstadoNumero;
  bloqueado: boolean;
  anio: number | null;
  fecha_asignacion: string | null;
  created_at: string;

  reserva_id: string | null;
  reserva_codigo: string | null;
  reserva_estado: string | null;

  estudiante_id: string | null;
  estudiante_nombre: string | null;
  estudiante_documento: string | null;
  estudiante_grado: string | null;

  plan_id: string | null;
  plan_codigo: string | null;
  plan_nombre: string | null;

  contrato_id: string | null;
  contrato_ruta: string | null;
  contrato_generado_en: string | null;
}

export interface FiltrosNumeracion {
  pagina: number;
  tamano: number;
  estado?: EstadoNumero;
  numero?: string;
  anio?: number;
  planId?: string;
  desde?: string;
  hasta?: string;
  buscar?: string;
}

export interface EstadisticasNumeracion {
  total: number;
  disponibles: number;
  asignados: number;
  bloqueados: number;
  porcentajeUso: number;
  porAnio: Array<{ anio: number; asignados: number }>;
}

export interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  plantilla_contrato: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

/** Un número asignado en el sistema, con su estado frente al Excel y su reserva. */
export interface NumeroDetalleConciliacion {
  numero_formateado: string;
  orden: number | null;
  abonado: boolean;
  reserva_id: string | null;
  reserva_codigo: string | null;
  estudiante_nombre: string | null;
  estudiante_documento: string | null;
  plan_nombre: string | null;
}

/**
 * Resultado de comparar el Excel de abonados contra los números asignados.
 * Cubre las tres situaciones: abonado, sin abonar y solo en el Excel.
 */
export interface ConciliacionResultado {
  totalEnExcel: number;
  totalAsignados: number;
  totalConciliados: number;
  totalSinAbonar: number;
  totalSoloExcel: number;
  numeros: NumeroDetalleConciliacion[];
  soloEnExcel: string[];
}
