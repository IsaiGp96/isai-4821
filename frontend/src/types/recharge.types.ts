import type { User } from './user.types'

// Datos que captura el formulario. El identificador y el correo se toman del usuario con sesión.
export interface RechargeInput {
  cardNumber: string
  expirationDate: string
  cvv: string
  cardholderName: string
  amount: number
}

// ok solo es true cuando SnailPay aprobó y el saldo nuevo quedó guardado.
export type RechargeOutcome = { ok: true; user: User; message: string } | { ok: false; message: string }
