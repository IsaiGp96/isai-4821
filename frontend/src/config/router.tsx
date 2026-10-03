import { createBrowserRouter, Navigate } from 'react-router'
import { GuestRoute } from '../components/GuestRoute'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { DashboardView } from '../views/DashboardView'
import { LoginView } from '../views/LoginView'
import { RegisterView } from '../views/RegisterView'
import { ROUTES } from './routes'

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: ROUTES.login, element: <LoginView /> },
      { path: ROUTES.register, element: <RegisterView /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [{ path: ROUTES.dashboard, element: <DashboardView /> }],
  },
  // La raíz y cualquier ruta desconocida van al dashboard; ProtectedRoute decide si hace falta el login.
  { path: '*', element: <Navigate to={ROUTES.dashboard} replace /> },
])
