import { Navigate, Outlet } from 'react-router'
import { ROUTES } from '../config/routes'
import { authService } from '../services/auth.service'

// Solo para usuarios sin sesión: quien ya entró no vuelve a ver el login ni el registro.
export function GuestRoute() {
  if (authService.getCurrentUser()) return <Navigate to={ROUTES.dashboard} replace />
  return <Outlet />
}
