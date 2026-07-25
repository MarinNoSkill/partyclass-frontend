import { useEffect } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GrupoCampos, Input, Select } from './FormField';
import { Combobox } from './Combobox';
import { CIUDADES, PROFESIONES } from '@/data/catalogos';
import {
  ACUDIENTE_VACIO,
  esquemaAcudiente,
  type AcudienteFormulario,
  type AcudienteFormularioEntrada,
} from '@/interfaces/formularios';
import { TIPOS_ID_ACUDIENTE } from '@/utils/formato';
import type { Acudiente } from '@/types/dominio.types';

interface PropsAcudienteForm {
  idFormulario: string;
  /** Acepta tanto la entidad del backend como los valores en curso del wizard. */
  valorInicial: Acudiente | AcudienteFormulario | null;
  soloLectura?: boolean;
  alEnviar: (datos: AcudienteFormulario) => void;
}

function aValoresFormulario(acudiente: Acudiente | AcudienteFormulario | null): AcudienteFormularioEntrada {
  if (!acudiente) return ACUDIENTE_VACIO;

  return {
    tipo_documento: acudiente.tipo_documento,
    numero_documento: acudiente.numero_documento,
    primer_nombre: acudiente.primer_nombre,
    segundo_nombre: acudiente.segundo_nombre ?? '',
    primer_apellido: acudiente.primer_apellido,
    segundo_apellido: acudiente.segundo_apellido ?? '',
    telefono: acudiente.telefono,
    email: acudiente.email ?? '',
    ocupacion: acudiente.ocupacion ?? '',
    direccion: acudiente.direccion ?? '',
    ciudad: acudiente.ciudad ?? '',
  };
}

/**
 * Formulario de un acudiente. Es agnóstico al rol: quien lo usa decide si es
 * padre o madre. Así el mismo componente sirve para ambas tarjetas del paso 2.
 */
export function AcudienteForm({
  idFormulario,
  valorInicial,
  soloLectura = false,
  alEnviar,
}: PropsAcudienteForm) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AcudienteFormularioEntrada, unknown, AcudienteFormulario>({
    // Ver nota en EstudianteForm: entrada ('') y salida (null) difieren.
    resolver: zodResolver(esquemaAcudiente) as Resolver<
      AcudienteFormularioEntrada,
      unknown,
      AcudienteFormulario
    >,
    defaultValues: aValoresFormulario(valorInicial),
    mode: 'onBlur',
  });

  useEffect(() => {
    reset(aValoresFormulario(valorInicial));
  }, [valorInicial, reset]);

  return (
    <form id={idFormulario} onSubmit={handleSubmit(alEnviar)} noValidate className="space-y-6">
      <GrupoCampos columnas={2}>
        <Select
          etiqueta="Tipo de documento"
          requerido
          disabled={soloLectura}
          opciones={TIPOS_ID_ACUDIENTE.map((t) => ({ valor: t.valor, etiqueta: t.etiqueta }))}
          error={errors.tipo_documento?.message}
          {...register('tipo_documento')}
        />
        <Input
          etiqueta="Número de documento"
          requerido
          soloNumeros
          autoComplete="off"
          disabled={soloLectura}
          error={errors.numero_documento?.message}
          {...register('numero_documento')}
        />
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
          etiqueta="Teléfono"
          type="tel"
          soloNumeros
          requerido
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
          requerido
          autoComplete="off"
          disabled={soloLectura}
          error={errors.email?.message}
          {...register('email')}
        />
        <Controller
          control={control}
          name="ocupacion"
          render={({ field, fieldState }) => (
            <Combobox
              etiqueta="Ocupación"
              opciones={PROFESIONES}
              placeholder="Escribe o elige de la lista"
              disabled={soloLectura}
              valor={field.value ?? ''}
              onCambio={field.onChange}
              error={fieldState.error?.message}
            />
          )}
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
        <Input
          etiqueta="Dirección"
          autoComplete="off"
          contenedorClassName="sm:col-span-2"
          disabled={soloLectura}
          error={errors.direccion?.message}
          {...register('direccion')}
        />
      </GrupoCampos>
    </form>
  );
}
