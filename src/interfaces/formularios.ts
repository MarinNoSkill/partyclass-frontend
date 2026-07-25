import { z } from 'zod';

/**
 * Esquemas de validación de los formularios del wizard.
 * Son el espejo de los validadores del backend: el backend sigue siendo la
 * autoridad, pero el usuario recibe el error antes de enviar nada.
 */

const soloEspaciosOVacio = (valor: string | undefined | null): boolean =>
  valor === undefined || valor === null || valor.trim() === '';

/** Campo de texto opcional: '' se normaliza a null antes de enviar. */
const textoOpcional = (max: number, etiqueta: string) =>
  z
    .string()
    .max(max, `${etiqueta} no puede superar ${max} caracteres.`)
    .optional()
    .transform((valor) => (soloEspaciosOVacio(valor) ? null : valor!.trim()));

const textoRequerido = (min: number, max: number, etiqueta: string) =>
  z
    .string({ required_error: `${etiqueta} es obligatorio.` })
    .trim()
    .min(min, `${etiqueta} debe tener al menos ${min} caracteres.`)
    .max(max, `${etiqueta} no puede superar ${max} caracteres.`);

const emailOpcional = z
  .string()
  .optional()
  .transform((valor) => (soloEspaciosOVacio(valor) ? null : valor!.trim().toLowerCase()))
  .refine((valor) => valor === null || z.string().email().safeParse(valor).success, {
    message: 'El correo electrónico no es válido.',
  });

const telefonoOpcional = z
  .string()
  .optional()
  .transform((valor) => (soloEspaciosOVacio(valor) ? null : valor!.trim()))
  .refine((valor) => valor === null || /^[0-9+()\s-]{7,20}$/.test(valor), {
    message: 'El teléfono debe tener entre 7 y 20 dígitos.',
  });

const numeroDocumento = z
  .string({ required_error: 'El número de documento es obligatorio.' })
  .trim()
  .regex(/^[0-9A-Za-z.-]{4,20}$/, 'Debe tener entre 4 y 20 caracteres, sin espacios.');

// ---------------------------------------------------------------------------
// Paso 1 — Estudiante
// ---------------------------------------------------------------------------

export const esquemaEstudiante = z.object({
  tipo_documento: z.enum(['CC', 'TI', 'RC', 'CE', 'PA'], {
    errorMap: () => ({ message: 'Selecciona un tipo de documento.' }),
  }),
  numero_documento: numeroDocumento,
  primer_nombre: textoRequerido(2, 60, 'El primer nombre'),
  segundo_nombre: textoOpcional(60, 'El segundo nombre'),
  primer_apellido: textoRequerido(2, 60, 'El primer apellido'),
  segundo_apellido: textoOpcional(60, 'El segundo apellido'),
  fecha_nacimiento: z
    .string({ required_error: 'La fecha de nacimiento es obligatoria.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona una fecha válida.')
    .refine(
      (valor) => {
        const fecha = new Date(`${valor}T00:00:00`);
        return !Number.isNaN(fecha.getTime()) && fecha < new Date();
      },
      { message: 'La fecha debe ser anterior a hoy.' },
    ),
  genero: z
    .union([z.enum(['M', 'F', 'OTRO']), z.literal('')])
    .optional()
    .transform((valor) => (valor === '' || valor === undefined ? null : valor)),
  grado: textoOpcional(60, 'El grado'),
  /** Grupo o dependencia (Décimo 1, A, B, Mecanografía, Salud…). Solo para 10° y 11°. */
  grupo: textoOpcional(80, 'El grupo'),
  institucion: textoOpcional(120, 'La institución'),
  /** EPS a la que está afiliado el estudiante. */
  eps: textoOpcional(80, 'La EPS'),
  /** Estudiante representante de grupo. */
  representante_grupo: textoOpcional(120, 'El representante'),
  /** Asesor que realizó la venta. */
  asesor: textoOpcional(120, 'El asesor'),
  telefono: telefonoOpcional,
  email: emailOpcional,
  direccion: textoOpcional(180, 'La dirección'),
  ciudad: textoOpcional(80, 'La ciudad'),
});

export type EstudianteFormulario = z.infer<typeof esquemaEstudiante>;
export type EstudianteFormularioEntrada = z.input<typeof esquemaEstudiante>;

// ---------------------------------------------------------------------------
// Paso 2 — Acudiente
// ---------------------------------------------------------------------------

export const esquemaAcudiente = z.object({
  tipo_documento: z.enum(['CC', 'CE', 'PA', 'NIT'], {
    errorMap: () => ({ message: 'Selecciona un tipo de documento.' }),
  }),
  numero_documento: numeroDocumento,
  primer_nombre: textoRequerido(2, 60, 'El primer nombre'),
  segundo_nombre: textoOpcional(60, 'El segundo nombre'),
  primer_apellido: textoRequerido(2, 60, 'El primer apellido'),
  segundo_apellido: textoOpcional(60, 'El segundo apellido'),
  telefono: z
    .string({ required_error: 'El teléfono es obligatorio.' })
    .trim()
    .regex(/^[0-9+()\s-]{7,20}$/, 'El teléfono debe tener entre 7 y 20 dígitos.'),
  // Obligatorio: a este correo se envía el código para habilitar la firma.
  email: z
    .string({ required_error: 'El correo es obligatorio para verificar la firma.' })
    .trim()
    .min(1, 'El correo es obligatorio para verificar la firma.')
    .email('El correo no es válido.'),
  ocupacion: textoOpcional(80, 'La ocupación'),
  direccion: textoOpcional(180, 'La dirección'),
  ciudad: textoOpcional(80, 'La ciudad'),
});

export type AcudienteFormulario = z.infer<typeof esquemaAcudiente>;
export type AcudienteFormularioEntrada = z.input<typeof esquemaAcudiente>;

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

export const esquemaConfiguracion = z.record(z.string(), z.string().max(500));
export type ConfiguracionFormulario = z.infer<typeof esquemaConfiguracion>;

// ---------------------------------------------------------------------------
// Valores iniciales
// ---------------------------------------------------------------------------

export const ESTUDIANTE_VACIO: EstudianteFormularioEntrada = {
  tipo_documento: 'TI',
  numero_documento: '',
  primer_nombre: '',
  segundo_nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  fecha_nacimiento: '',
  genero: '',
  grado: '',
  grupo: '',
  institucion: '',
  eps: '',
  representante_grupo: '',
  asesor: '',
  telefono: '',
  email: '',
  direccion: '',
  ciudad: '',
};

export const ACUDIENTE_VACIO: AcudienteFormularioEntrada = {
  tipo_documento: 'CC',
  numero_documento: '',
  primer_nombre: '',
  segundo_nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  telefono: '',
  email: '',
  ocupacion: '',
  direccion: '',
  ciudad: '',
};
