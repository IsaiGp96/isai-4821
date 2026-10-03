import { useState, type FormEvent } from 'react'
import { FormError } from '../components/FormError'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { SNAILPAY_MAX_AMOUNT } from '../config/api'
import { formatCurrency } from '../lib/format'
import { rechargeService } from '../services/recharge.service'
import type { User } from '../types/user.types'

interface RechargeFormProps {
  user: User
  onApproved: (user: User, message: string) => void
  // Se llama después de cada intento, aprobado o no: el historial guarda todas las respuestas.
  onSettled: () => void
}

// Agrupa de 4 en 4 para que el número se lea como en la tarjeta: 1234 1234 1234 1234.
function formatCardNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

// Agrega la diagonal al escribir: 1226 -> 12/26.
function formatExpiration(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

export function RechargeForm({ user, onApproved, onSettled }: RechargeFormProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    // Un monto vacío o inválido llega como NaN y SnailPay lo rechaza con su propio mensaje.
    const outcome = await rechargeService.recharge(user, {
      cardNumber,
      expirationDate,
      cvv,
      cardholderName,
      amount: amount.trim() === '' ? Number.NaN : Number(amount),
    })
    setSubmitting(false)
    onSettled()

    if (!outcome.ok) return setError(outcome.message)
    onApproved(outcome.user, outcome.message)
  }

  // noValidate: las reglas y los mensajes vienen de SnailPay, igual en todos los navegadores.
  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cardNumber">Número de tarjeta</Label>
        <Input
          id="cardNumber"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          value={cardNumber}
          onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="expirationDate">Vencimiento</Label>
          <Input
            id="expirationDate"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            value={expirationDate}
            onChange={(event) => setExpirationDate(formatExpiration(event.target.value))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            maxLength={3}
            value={cvv}
            onChange={(event) => setCvv(event.target.value.replace(/\D/g, ''))}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cardholderName">Nombre en la tarjeta</Label>
        <Input
          id="cardholderName"
          autoComplete="cc-name"
          value={cardholderName}
          onChange={(event) => setCardholderName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Monto</Label>
        <Input
          id="amount"
          inputMode="decimal"
          placeholder="0.00"
          aria-describedby="amount-hint"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <p id="amount-hint" className="text-xs text-muted-foreground">
          Máximo {formatCurrency(SNAILPAY_MAX_AMOUNT)} por recarga.
        </p>
      </div>
      <FormError message={error} />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Procesando pago…' : 'Cargar saldo'}
      </Button>
    </form>
  )
}
