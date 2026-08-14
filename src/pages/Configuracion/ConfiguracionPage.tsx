import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Save, Settings } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PantallaCargando } from '@/components/ui/Spinner';
import { GrupoCampos, Input } from '@/components/forms/FormField';
import { configuracionService } from '@/services/configuracion.service';
import { mensajeDeError, useReportarError } from '@/hooks/useMensajeError';
import { useToast } from '@/contexts/ToastContext';
import { InicioImagenesPage } from '@/pages/Admin/InicioImagenesPage';

const CLAVE_QUERY = ['configuracion'] as const;

/** Etiquetas legibles. Cualquier clave no listada usa su `descripcion` de BD. */
const ETIQUETAS: Record<string, string> = {
  empresa_nombre: 'Razón social',
  empresa_nit: 'NIT',
  empresa_direccion: 'Dirección',
  empresa_telefono: 'Teléfono',
  empresa_email: 'Correo electrónico',
  empresa_ciudad: 'Ciudad de suscripción',
  contrato_titulo: 'Título del contrato',
  contrato_version: 'Versión de la plantilla',
};

export function ConfiguracionPage() {
  const cliente = useQueryClient();
  const reportarError = useReportarError();
  const { exito } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: CLAVE_QUERY,
    queryFn: () => configuracionService.listar(),
  });

  const [valores, setValores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    setValores(
      Object.fromEntries(data.map((parametro) => [parametro.clave, parametro.valor ?? ''])),
    );
  }, [data]);

  const guardar = useMutation({
    mutationFn: () =>
      configuracionService.actualizar(
        Object.entries(valores).map(([clave, valor]) => ({
          clave,
          valor: valor.trim() === '' ? null : valor.trim(),
        })),
      ),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: CLAVE_QUERY });
      exito('Configuración guardada');
    },
    onError: (fallo) => reportarError(fallo, 'No se pudo guardar la configuración'),
  });

  if (isLoading) return <PantallaCargando mensaje="Cargando configuración…" />;

  if (isError || !data) {
    return (
      <Card>
        <EmptyState
          icono={<Settings className="size-6" aria-hidden />}
          titulo="No se pudo cargar la configuración"
          descripcion={mensajeDeError(error)}
        />
      </Card>
    );
  }

  const parametrosEmpresa = data.filter((p) => p.clave.startsWith('empresa_'));
  const parametrosContrato = data.filter((p) => p.clave.startsWith('contrato_'));

  const campo = (clave: string, descripcion: string | null) => (
    <Input
      key={clave}
      etiqueta={ETIQUETAS[clave] ?? clave}
      ayuda={descripcion ?? undefined}
      value={valores[clave] ?? ''}
      onChange={(evento) =>
        setValores((actuales) => ({ ...actuales, [clave]: evento.target.value }))
      }
    />
  );

  return (
    <div className="space-y-5">
      <Card className="space-y-6">
        <CardHeader
          titulo="Datos de la empresa"
          descripcion="Esta información se imprime en el encabezado y las cláusulas del contrato."
          icono={<Building2 className="size-5" aria-hidden />}
        />
        <GrupoCampos columnas={2}>
          {parametrosEmpresa.map((p) => campo(p.clave, p.descripcion))}
        </GrupoCampos>
      </Card>

      <Card className="space-y-6">
        <CardHeader
          titulo="Contrato"
          descripcion="Parámetros de la plantilla del contrato PDF."
          icono={<Settings className="size-5" aria-hidden />}
        />
        <GrupoCampos columnas={2}>
          {parametrosContrato.map((p) => campo(p.clave, p.descripcion))}
        </GrupoCampos>
      </Card>

      <div className="flex justify-end">
        <Button
          cargando={guardar.isPending}
          onClick={() => guardar.mutate()}
          iconoIzquierda={<Save className="size-4" aria-hidden />}
        >
          Guardar cambios
        </Button>
      </div>

      {/* Gestión de las imágenes del inicio público (antes un módulo aparte). */}
      <div className="border-t border-tinta-200 pt-6">
        <InicioImagenesPage />
      </div>
    </div>
  );
}
