import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export function NoEncontrada() {
  return (
    <Card className="mx-auto max-w-lg">
      <EmptyState
        icono={<Compass className="size-6" aria-hidden />}
        titulo="Página no encontrada"
        descripcion="La ruta que intentas abrir no existe o fue movida."
        accion={
          <Link to="/">
            <Button>Ir al dashboard</Button>
          </Link>
        }
      />
    </Card>
  );
}
