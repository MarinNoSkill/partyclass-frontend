import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GrupoCampos, Input, Select } from './FormField';
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
    institucion: estudiante.institucion ?? '',
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
}: PropsEstudianteForm) {
  const {
    register,
    handleSubmit,
    reset,
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
          inputMode="numeric"
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
        <Input
          etiqueta="Fecha de nacimiento"
          type="date"
          requerido
          max={new Date().toISOString().slice(0, 10)}
          disabled={soloLectura}
          error={errors.fecha_nacimiento?.message}
          {...register('fecha_nacimiento')}
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
        <Input
          etiqueta="Institución educativa"
          autoComplete="off"
          disabled={soloLectura}
          error={errors.institucion?.message}
          {...register('institucion')}
        />
        <Input
          etiqueta="Grado"
          autoComplete="off"
          placeholder="11-B"
          disabled={soloLectura}
          error={errors.grado?.message}
          {...register('grado')}
        />
      </GrupoCampos>

      <GrupoCampos titulo="Contacto" columnas={2}>
        <Input
          etiqueta="Teléfono"
          type="tel"
          inputMode="tel"
          autoComplete="off"
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
        <Input
          etiqueta="Ciudad"
          autoComplete="off"
          disabled={soloLectura}
          error={errors.ciudad?.message}
          {...register('ciudad')}
        />
      </GrupoCampos>
    </form>
  );
}
