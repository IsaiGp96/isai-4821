import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BetsDonutChart } from '../components/BetsDonutChart'
import { RaceWinsBarChart } from '../components/RaceWinsBarChart'
import { RechargeDialog } from '../components/RechargeDialog'
import { Button } from '../components/ui/button'
import { ROUTES } from '../config/routes'
import { authService } from '../services/auth.service'
import { raceService } from '../services/race.service'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

// Vista provisional: el diseño final del dashboard llega en el siguiente commit.
export function DashboardView() {
  const navigate = useNavigate()
  // El usuario vive en el estado: al aprobarse una recarga, el saldo se actualiza sin recargar la página.
  const [user, setUser] = useState(() => authService.getCurrentUser())
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
      {user && (
        <div className="flex items-center justify-between">
          <p>
            Saldo: <span className="font-semibold">{currency.format(user.balance)}</span>
          </p>
          <RechargeDialog user={user} onRecharged={setUser} />
        </div>
      )}
      {day && (
        <div className="grid gap-4 md:grid-cols-2">
          <BetsDonutChart bets={day.bets} />
          <RaceWinsBarChart wins={day.wins} />
        </div>
      )}
    </main>
  )
}
