import { useNavigate } from 'react-router'
import { Button } from '../components/ui/button'
import { ROUTES } from '../config/routes'
import { authService } from '../services/auth.service'

// Vista provisional: las gráficas y la recarga de saldo llegan en la rama del dashboard.
export function DashboardView() {
  const navigate = useNavigate()
  const user = authService.getCurrentUser()

  function handleLogout() {
    authService.logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hola, {user?.fullName}</h1>
        <Button variant="outline" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
    </main>
  )
}
