import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { BalanceCard } from '../components/BalanceCard'
import { BetsDonutChart } from '../components/BetsDonutChart'
import { DashboardHeader } from '../components/DashboardHeader'
import { RaceWinsBarChart } from '../components/RaceWinsBarChart'
import { RechargeHistory } from '../components/RechargeHistory'
import { ROUTES } from '../config/routes'
import { authService } from '../services/auth.service'
import { raceService } from '../services/race.service'
import { rechargeService } from '../services/recharge.service'
import type { User } from '../types/user.types'

export function DashboardView() {
  // ProtectedRoute ya validó la sesión; esta revisión solo cubre que se borre entre renders.
  const user = authService.getCurrentUser()
  if (!user) return <Navigate to={ROUTES.login} replace />
  return <Dashboard initialUser={user} />
}

function Dashboard({ initialUser }: { initialUser: User }) {
  const navigate = useNavigate()
  // El usuario y el historial viven en el estado: tras una recarga se ven al instante, sin recargar la página.
  const [user, setUser] = useState(initialUser)
  const [history, setHistory] = useState(() => rechargeService.getHistory(initialUser.id))
  const day = useMemo(() => raceService.simulateDay(user.id), [user.id])

  function handleLogout() {
    authService.logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <div className="min-h-svh bg-muted">
      <DashboardHeader fullName={user.fullName} onLogout={handleLogout} />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hola, {user.fullName}</h1>
          <p className="text-sm text-muted-foreground">Este es el resumen de tu día de carreras.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <BalanceCard
            user={user}
            onRecharged={setUser}
            onSettled={() => setHistory(rechargeService.getHistory(user.id))}
          />
          <div className="md:col-span-2">
            <RechargeHistory recharges={history} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <BetsDonutChart bets={day.bets} />
          <RaceWinsBarChart wins={day.wins} />
        </div>
      </main>
    </div>
  )
}
