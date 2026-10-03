import { CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { RechargeForm } from '../forms/RechargeForm'
import type { User } from '../types/user.types'
import { Button } from './ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'

interface RechargeDialogProps {
  user: User
  onRecharged: (user: User) => void
  onSettled: () => void
}

export function RechargeDialog({ user, onRecharged, onSettled }: RechargeDialogProps) {
  const [open, setOpen] = useState(false)
  const [approvedMessage, setApprovedMessage] = useState<string | null>(null)

  // Al cerrar se limpia todo: la siguiente recarga empieza con el formulario vacío.
  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setApprovedMessage(null)
  }

  function handleApproved(updated: User, message: string) {
    onRecharged(updated)
    setApprovedMessage(message)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Cargar saldo</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cargar saldo</DialogTitle>
          <DialogDescription>El pago se procesa con SnailPay.</DialogDescription>
        </DialogHeader>
        {approvedMessage ? (
          <>
            <div role="status" className="flex items-start gap-3 rounded-md bg-green-600/10 p-3 text-sm">
              <CircleCheck className="size-5 shrink-0 text-green-700 dark:text-green-400" aria-hidden />
              <div>
                <p className="font-medium">Recarga aprobada</p>
                <p className="text-muted-foreground">{approvedMessage}</p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Listo</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <RechargeForm user={user} onApproved={handleApproved} onSettled={onSettled} />
        )}
      </DialogContent>
    </Dialog>
  )
}
