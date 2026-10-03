import { LogOut } from 'lucide-react'
import { Button } from './ui/button'

interface DashboardHeaderProps {
  fullName: string
  onLogout: () => void
}

export function DashboardHeader({ fullName, onLogout }: DashboardHeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="font-semibold tracking-tight">🐌 Carrera de caracoles</p>
        <div className="flex min-w-0 items-center gap-3">
          <p className="hidden truncate text-sm text-muted-foreground sm:block">{fullName}</p>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut aria-hidden />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </header>
  )
}
