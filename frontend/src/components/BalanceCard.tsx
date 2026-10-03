import { Wallet } from 'lucide-react'
import { formatCurrency } from '../lib/format'
import type { User } from '../types/user.types'
import { RechargeDialog } from './RechargeDialog'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'

interface BalanceCardProps {
  user: User
  onRecharged: (user: User) => void
  onSettled: () => void
}

export function BalanceCard({ user, onRecharged, onSettled }: BalanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="flex items-center gap-2">
            <Wallet className="size-4 text-muted-foreground" aria-hidden />
            Saldo actual
          </h2>
        </CardTitle>
        <CardDescription>Disponible para apostar.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* aria-live: el lector de pantalla anuncia el saldo nuevo después de una recarga. */}
        <p className="text-4xl font-semibold tracking-tight tabular-nums" aria-live="polite">
          {formatCurrency(user.balance)}
        </p>
      </CardContent>
      <CardFooter>
        <RechargeDialog user={user} onRecharged={onRecharged} onSettled={onSettled} />
      </CardFooter>
    </Card>
  )
}
