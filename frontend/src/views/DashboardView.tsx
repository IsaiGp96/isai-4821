import { useNavigate } from 'react-router'
import { BetsDonutChart } from '../components/BetsDonutChart'
import { RaceWinsBarChart } from '../components/RaceWinsBarChart'
import { Button } from '../components/ui/button'
import { ROUTES } from '../config/routes'
import { authService } from '../services/auth.service'
import { raceService } from '../services/race.service'

// Vista provisional: el saldo y la recarga llegan en los siguientes commits.
export function DashboardView() {
  const navigate = useNavigate()
  const user = authService.getCurrentUser()
  const day = user ? raceService.simulateDay(user.id) : null

  function handleLogout() {
    authService.logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hola, {user?.fullName}</h1>
        <Button variant="outline" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
      {day && (
        <div className="grid gap-4 md:grid-cols-2">
          <BetsDonutChart bets={day.bets} />
          <RaceWinsBarChart wins={day.wins} />
        </div>
      )}
    </main>
  )
}
