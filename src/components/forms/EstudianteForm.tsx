import { useEffect } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GrupoCampos, Input, Select } from './FormField';
import { InputFecha } from './InputFecha';
import { Combobox } from './Combobox';
import {
  CIUDADES,
  COLEGIOS_MEDELLIN,
  EPS,
  GRADOS,
  gradoTieneGrupo,
} from '@/data/catalogos';
import {
  ESTUDIANTE_VACIO,
  esquemaEstudiante,
  type EstudianteFormulario,
  type EstudianteFormularioEntrada,
} from '@/interfaces/formularios';
import { GENEROS, TIPOS_ID_ESTUDIANTE } from '@/utils/formato';
import type { Estudiante } from '@/types/dominio.types';

interface PropsEstudianteForm {
  idFormulario: string;
  /** Acepta tanto la entidad del backend como los valores en curso del wizard. */
  valorInicial: Estudiante | EstudianteFormulario | null;
  soloLectura?: boolean;
  alEnviar: (datos: EstudianteFormulario) => void;
  alCambiarValidez?: (esValido: boolean) => void;
  /** Oculta el campo "representante de grupo" (en el módulo de representantes sobra). */
  ocultarRepresentanteGrupo?: boolean;
}

/** Convierte la entidad del backend en valores de formulario (null -> ''). */
function aValoresFormulario(estudiante: Estudiante | EstudianteFormulario | null): EstudianteFormularioEntrada {
  if (!estudiante) return ESTUDIANTE_VACIO;

  return {
    tipo_documento: estudiante.tipo_documento,
    numero_documento: estudiante.numero_documento,
    primer_nombre: estudiante.primer_nombre,
    segundo_nombre: estudiante.segundo_nombre ?? '',
    primer_apellido: estudiante.primer_apellido,
    segundo_apellido: estudiante.segundo_apellido ?? '',
    fecha_nacimiento: estudiante.fecha_nacimiento,
    genero: estudiante.genero ?? '',
    grado: estudiante.grado ?? '',
    grupo: ('grupo' in estudiante ? estudiante.grupo : '') ?? '',
    institucion: estudiante.institucion ?? '',
    eps: ('eps' in estudiante ? estudiante.eps : '') ?? '',
    representante_grupo:
      ('representante_grupo' in estudiante ? estudiante.representante_grupo : '') ?? '',
    asesor: ('asesor' in estudiante ? estudiante.asesor : '') ?? '',
    telefono: estudiante.telefono ?? '',
    email: estudiante.email ?? '',
    direccion: estudiante.direccion ?? '',
    ciudad: estudiante.ciudad ?? '',
  };
}

export function EstudianteForm({
  idFormulario,
  valorInicial,
  soloLectura = false,
  alEnviar,
  alCambiarValidez,
  ocultarRepresentanteGrupo = false,
}: PropsEstudianteForm) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isValid },
  } = useForm<EstudianteFormularioEntrada, unknown, EstudianteFormulario>({
    // Zod transforma '' -> null, así que el tipo de entrada y el de salida
    // difieren. zodResolver no expresa esa dualidad; el cast la declara.
    resolver: zodResolver(esquemaEstudiante) as Resolver<
      EstudianteFormularioEntrada,
      unknown,
      EstudianteFormulario
    >,
    defaultValues: aValoresFormulario(valorInicial),
    mode: 'onBlur',
  });

  useEffect(() => {
    reset(aValoresFormulario(valorInicial));
  }, [valorInicial, reset]);

  useEffect(() => {
    alCambiarValidez?.(isValid);
  }, [isValid, alCambiarValidez]);

  return (
    <form id={idFormulario} onSubmit={handleSubmit(alEnviar)} noValidate className="space-y-7">
      <GrupoCampos titulo="Identificación" columnas={2}>
        <Select
          etiqueta="Tipo de documento"
          requerido
          disabled={soloLectura}
          opciones={TIPOS_ID_ESTUDIANTE.map((t) => ({ valor: t.valor, etiqueta: t.etiqueta }))}
          error={errors.tipo_documento?.message}
          {...register('tipo_documento')}
        />
        <Input
          etiqueta="Número de documento"
          requerido
          soloNumeros
          autoComplete="off"
          placeholder="1012345678"
          disabled={soloLectura}
          error={errors.numero_documento?.message}
          {...register('numero_documento')}
        />
      </GrupoCampos>

      <GrupoCampos titulo="Datos personales" columnas={2}>
        <Input
          etiqueta="Primer nombre"
          requerido
          autoComplete="off"
          disabled={soloLectura}
          error={errors.primer_nombre?.message}
          {...register('primer_nombre')}
        />
        <Input
          etiqueta="Segundo nombre"
          autoComplete="off"
          disabled={soloLectura}
          error={errors.segundo_nombre?.message}
          {...register('segundo_nombre')}
        />
        <Input
          etiqueta="Primer apellido"
          requerido
          autoComplete="off"
          disabled={soloLectura}
          error={errors.primer_apellido?.message}
          {...register('primer_apellido')}
        />
        <Input
          etiqueta="Segundo apellido"
          autoComplete="off"
          disabled={soloLectura}
          error={errors.segundo_apellido?.message}
          {...register('segundo_apellido')}
        />
        <Controller
          control={control}
          name="fecha_nacimiento"
          render={({ field, fieldState }) => (
            <InputFecha
              etiqueta="Fecha de nacimiento"
              requerido
              disabled={soloLectura}
              valorIso={field.value ?? ''}
              onCambio={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Select
          etiqueta="Género"
          placeholder="Sin especificar"
          disabled={soloLectura}
          opciones={GENEROS.map((g) => ({ valor: g.valor, etiqueta: g.etiqueta }))}
          error={errors.genero?.message}
          {...register('genero')}
        />
      </GrupoCampos>

      <GrupoCampos titulo="Información académica" columnas={2}>
        <Controller
          control={control}
          name="institucion"
          render={({ field, fieldState }) => (
            <Combobox
              etiqueta="Institución educativa"
              opciones={COLEGIOS_MEDELLIN}
              placeholder="Escribe o elige de la lista"
              disabled={soloLectura}
              valor={field.value ?? ''}
              onCambio={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Select
          etiqueta="Grado"
          placeholder="Selecciona el grado"
          disabled={soloLectura}
          opciones={GRADOS.map((g) => ({ valor: g, etiqueta: g }))}
          error={errors.grado?.message}
          {...register('grado')}
        />
        <Controller
          control={control}
          name="eps"
          render={({ field, fieldState }) => (
            <Combobox
              etiqueta="EPS (entidad de salud)"
              opciones={EPS}
              placeholder="Escribe o elige la EPS"
              disabled={soloLectura}
              valor={field.value ?? ''}
              onCambio={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        {/* El grupo/dependencia solo aplica a 10° y 11°. Texto libre. */}
        {gradoTieneGrupo(watch('grado') ?? '') && (
          <Input
            etiqueta="Grupo / dependencia"
            autoComplete="off"
            placeholder="Décimo 1, A, Mecanografía, Salud…"
            disabled={soloLectura}
            error={errors.grupo?.message}
            {...register('grupo')}
          />
        )}
      </GrupoCampos>

      <GrupoCampos titulo="Datos de la venta" columnas={2}>
        {!ocultarRepresentanteGrupo && (
          <Input
            etiqueta="Estudiante representante de grupo"
            autoComplete="off"
            placeholder="Nombre del representante"
            disabled={soloLectura}
            error={errors.representante_grupo?.message}
            {...register('representante_grupo')}
          />
        )}
        <Input
          etiqueta="Asesor que realizó la venta"
          autoComplete="off"
          placeholder="Nombre del asesor"
          disabled={soloLectura}
          error={errors.asesor?.message}
          {...register('asesor')}
        />
      </GrupoCampos>

      <GrupoCampos titulo="Contacto" columnas={2}>
        <Input
          etiqueta="Teléfono"
          type="tel"
          soloNumeros
          autoComplete="off"
          placeholder="3001234567"
          disabled={soloLectura}
          error={errors.telefono?.message}
          {...register('telefono')}
        />
        <Input
          etiqueta="Correo electrónico"
          type="email"
          inputMode="email"
          autoComplete="off"
          disabled={soloLectura}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          etiqueta="Dirección"
          autoComplete="off"
          disabled={soloLectura}
          error={errors.direccion?.message}
          {...register('direccion')}
        />
        <Controller
          control={control}
          name="ciudad"
          render={({ field, fieldState }) => (
            <Combobox
              etiqueta="Ciudad"
              opciones={CIUDADES}
              placeholder="Medellín"
              disabled={soloLectura}
              valor={field.value ?? ''}
              onCambio={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </GrupoCampos>
    </form>
  );
}
