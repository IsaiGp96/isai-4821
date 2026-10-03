import { Navigate, Outlet } from 'react-router'
import { ROUTES } from '../config/routes'
import { authService } from '../services/auth.service'

// Solo para usuarios con sesión; sin sesión se redirige al login.
export function ProtectedRoute() {
  if (!authService.getCurrentUser()) return <Navigate to={ROUTES.login} replace />
  return <Outlet />
}
