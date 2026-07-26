import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { NuevaReservaPage } from '@/pages/NuevaReserva/NuevaReservaPage';
import { InscripcionPage } from '@/pages/NuevaReserva/InscripcionPage';
import { RutaProtegida } from '@/routes/RutaProtegida';
import { AdminLayout } from '@/pages/Admin/AdminLayout';
import { LoginPage } from '@/pages/Admin/LoginPage';
import { RegistrosPage } from '@/pages/Admin/RegistrosPage';
import { RegistroDetallePage } from '@/pages/Admin/RegistroDetallePage';
import { NumeracionPage } from '@/pages/Admin/NumeracionPage';
import { PlanesPage } from '@/pages/Admin/PlanesPage';
import { InicioImagenesPage } from '@/pages/Admin/InicioImagenesPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { ConfiguracionPage } from '@/pages/Configuracion/ConfiguracionPage';
import { NoEncontrada } from '@/pages/NoEncontrada';

/**
 * Mapa de rutas.
 *
 * El área pública expone **únicamente el registro**. Cualquier consulta de
 * datos ya guardados —listados, detalle, dashboard, planes, numeración y
 * configuración— exige sesión de administrador.
 *
 * Consecuencia buscada: desde el equipo donde firma una familia no hay forma
 * de llegar a los datos de otra, ni siquiera escribiendo la URL a mano.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* --- Área operativa: solo registrar --- */}
      <Route element={<PublicLayout />}>
        <Route index element={<NuevaReservaPage />} />
        {/* Inscripción por enlace personalizado de un colegio. */}
        <Route path="inscripcion/:token" element={<InscripcionPage />} />
        {/* Cualquier ruta pública desconocida vuelve al registro. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* --- Panel de administración (JWT) --- */}
      <Route path="/admin/login" element={<LoginPage />} />

      <Route path="/admin" element={<RutaProtegida />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="registros" element={<RegistrosPage />} />
          <Route path="registros/:id" element={<RegistroDetallePage />} />
          <Route path="planes" element={<PlanesPage />} />
          <Route path="inicio" element={<InicioImagenesPage />} />
          <Route path="numeracion" element={<NumeracionPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Route>
    </Routes>
  );
}
