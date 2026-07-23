/** Espejo de los tipos del backend. Fuente única de verdad del contrato de datos. */

export type EstadoReserva = 'BORRADOR' | 'COMPLETADA' | 'ANULADA';
export type RolAcudiente = 'PADRE' | 'MADRE';
export type TipoIdEstudiante = 'CC' | 'TI' | 'RC' | 'CE' | 'PA';
export type TipoIdAcudiente = 'CC' | 'CE' | 'PA' | 'NIT';
export type Genero = 'M' | 'F' | 'OTRO';

export interface Reserva {
  id: string;
  codigo: string;
  estado: EstadoReserva;
  paso_actual: number;
  evento: string | null;
  observaciones: string | null;
  finalizada_en: string | null;
  anulada_en: string | null;
  motivo_anulacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface Estudiante {
  id: string;
  reserva_id: string;
  tipo_documento: TipoIdEstudiante;
  numero_documento: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  fecha_nacimiento: string;
  genero: Genero | null;
  grado: string | null;
  institucion: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string | null;
  created_at: string;
  updated_at: string;
}

export interface Acudiente {
  id: string;
  reserva_id: string;
  rol: RolAcudiente;
  tipo_documento: TipoIdAcudiente;
  numero_documento: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  telefono: string;
  email: string | null;
  ocupacion: string | null;
  direccion: string | null;
  ciudad: string | null;
  created_at: string;
  updated_at: string;
}

export interface Firma {
  id: string;
  reserva_id: string;
  rol: RolAcudiente;
  ruta_storage: string;
  ancho_px: number;
  alto_px: number;
  tamano_bytes: number;
  firmada_en: string;
}

export interface Contrato {
  id: string;
  reserva_id: string;
  ruta_storage: string;
  version_plantilla: string;
  hash_sha256: string | null;
  tamano_bytes: number;
  generado_en: string;
}

export interface ReservaCompleta extends Reserva {
  estudiante: Estudiante | null;
  acudientes: Acudiente[];
  firmas: Firma[];
  contrato: Contrato | null;
}

export interface ReservaResumen {
  id: string;
  codigo: string;
  estado: EstadoReserva;
  paso_actual: number;
  evento: string | null;
  created_at: string;
  updated_at: string;
  finalizada_en: string | null;
  estudiante_nombre: string | null;
  estudiante_documento: string | null;
  estudiante_grado: string | null;
  numero_convenio: string | null;
  plan_id: string | null;
  total_firmas: number;
  total_acudientes: number;
  tiene_contrato: boolean;
}

export interface ParametroConfiguracion {
  clave: string;
  valor: string | null;
  descripcion: string | null;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Vista de auditoría (panel de administración, requiere JWT)
// ---------------------------------------------------------------------------

export interface FirmaAuditoria extends Firma {
  url: string | null;
  relacionAspecto: number;
}

export interface ContratoAuditoria {
  id: string;
  url: string | null;
  version_plantilla: string;
  hash_sha256: string | null;
  tamano_bytes: number;
  generado_en: string;
}

export interface IntegridadReserva {
  tieneEstudiante: boolean;
  totalAcudientes: number;
  acudientesSinFirma: RolAcudiente[];
  tieneContrato: boolean;
  contratoPosteriorAFirmas: boolean;
  completa: boolean;
}

export interface ReservaAuditoria
  extends Omit<ReservaCompleta, 'firmas' | 'contrato'> {
  firmas: FirmaAuditoria[];
  contrato: ContratoAuditoria | null;
  /** Números de sorteo asignados (uno por boleta). Vacío hasta generar el convenio. */
  numerosConvenio: string[];
  integridad: IntegridadReserva;
}

export interface ResumenDashboard {
  totales: {
    todas: number;
    borradores: number;
    completadas: number;
    anuladas: number;
  };
  ultimos30Dias: number;
  ultimos7Dias: number;
  tasaCompletitud: number;
  recientes: ReservaResumen[];
}
