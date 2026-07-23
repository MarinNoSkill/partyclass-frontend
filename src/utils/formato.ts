import type { EstadoReserva, RolAcudiente } from '@/types/dominio.types';

export const ETIQUETA_ESTADO: Record<EstadoReserva, string> = {
  BORRADOR: 'Borrador',
  COMPLETADA: 'Completada',
  ANULADA: 'Anulada',
};

export const ETIQUETA_ROL: Record<RolAcudiente, string> = {
  PADRE: 'Padre',
  MADRE: 'Madre',
};

export const TIPOS_ID_ESTUDIANTE = [
  { valor: 'TI', etiqueta: 'Tarjeta de identidad' },
  { valor: 'RC', etiqueta: 'Registro civil' },
  { valor: 'CC', etiqueta: 'Cédula de ciudadanía' },
  { valor: 'CE', etiqueta: 'Cédula de extranjería' },
  { valor: 'PA', etiqueta: 'Pasaporte' },
] as const;

export const TIPOS_ID_ACUDIENTE = [
  { valor: 'CC', etiqueta: 'Cédula de ciudadanía' },
  { valor: 'CE', etiqueta: 'Cédula de extranjería' },
  { valor: 'PA', etiqueta: 'Pasaporte' },
  { valor: 'NIT', etiqueta: 'NIT' },
] as const;

export const GENEROS = [
  { valor: 'F', etiqueta: 'Femenino' },
  { valor: 'M', etiqueta: 'Masculino' },
  { valor: 'OTRO', etiqueta: 'Otro' },
] as const;

export function formatearBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

const formateadorFecha = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const formateadorFechaHora = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return '—';
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? '—' : formateadorFecha.format(fecha);
}

export function formatearFechaHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? '—' : formateadorFechaHora.format(fecha);
}

/** Convierte 'AAAA-MM-DD' a 'DD/MM/AAAA' sin desplazamiento de zona horaria. */
export function formatearFechaSimple(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [anio, mes, dia] = iso.split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : iso;
}

export function nombreCompleto(persona: {
  primer_nombre?: string | null;
  segundo_nombre?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
} | null | undefined): string {
  if (!persona) return '—';

  const partes = [
    persona.primer_nombre,
    persona.segundo_nombre,
    persona.primer_apellido,
    persona.segundo_apellido,
  ].filter((parte): parte is string => Boolean(parte && parte.trim()));

  return partes.length > 0 ? partes.join(' ') : '—';
}

export function iniciales(texto: string | null | undefined): string {
  if (!texto) return '?';
  return texto
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}
