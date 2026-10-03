import { CircleCheck, CircleX, TriangleAlert, type LucideIcon } from 'lucide-react'
import { formatCurrency, formatDateTime, maskCardNumber } from '../lib/format'
import { cn } from '../lib/utils'
import type { ChargeResponse, ChargeStatus } from '../types/snailpay.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

const VISIBLE_RECHARGES = 5

// Cada estado lleva ícono y texto además del color: no depende solo del color para entenderse.
const STATUS_DISPLAY: Record<ChargeStatus, { label: string; icon: LucideIcon; className: string }> = {
  approved: { label: 'Aprobada', icon: CircleCheck, className: 'text-green-700 dark:text-green-400' },
  rejected: { label: 'Rechazada', icon: CircleX, className: 'text-destructive' },
  error: { label: 'Error del sistema', icon: TriangleAlert, className: 'text-amber-700 dark:text-amber-400' },
}

export function RechargeHistory({ recharges }: { recharges: ChargeResponse[] }) {
  // Las más recientes primero.
  const latest = [...recharges].reverse().slice(0, VISIBLE_RECHARGES)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Últimas recargas</h2>
        </CardTitle>
        <CardDescription>Incluye las rechazadas; solo las aprobadas suman al saldo.</CardDescription>
      </CardHeader>
      <CardContent>
        {latest.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no tienes recargas.</p>
        ) : (
          <ul className="divide-y">
            {latest.map((recharge) => {
              const status = STATUS_DISPLAY[recharge.status]
              const Icon = status.icon
              return (
                <li key={recharge.id} className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-start gap-2">
                    <Icon className={cn('mt-0.5 size-4 shrink-0', status.className)} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{status.label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDateTime(recharge.date_created)} · {maskCardNumber(recharge.card_number)} ·{' '}
                        {recharge.reference}
                      </p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      'shrink-0 text-sm tabular-nums',
                      recharge.status === 'approved' ? 'font-medium' : 'text-muted-foreground line-through',
                    )}
                  >
                    {formatCurrency(recharge.transaction_amount)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
