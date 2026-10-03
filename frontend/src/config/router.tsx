import { createBrowserRouter, Navigate } from 'react-router'
import { GuestRoute } from '../components/GuestRoute'
import { ProtectedRoute } from '../components/ProtectedRoute'
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
    children: [
      {
        path: ROUTES.dashboard,
        // Carga diferida: Recharts solo se descarga al entrar al dashboard, no en el login ni en el registro.
        lazy: async () => {
          const { DashboardView } = await import('../views/DashboardView')
          return { Component: DashboardView }
        },
        // Se muestra mientras se descarga el dashboard al abrir la página directamente en esta ruta.
        HydrateFallback: () => (
          <p role="status" className="p-6 text-sm text-muted-foreground">
            Cargando…
          </p>
        ),
      },
    ],
  },
  // La raíz y cualquier ruta desconocida van al dashboard; ProtectedRoute decide si hace falta el login.
  { path: '*', element: <Navigate to={ROUTES.dashboard} replace /> },
])
