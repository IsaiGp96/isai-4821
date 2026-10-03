import type { RechargeInput, RechargeOutcome } from '../types/recharge.types'
import type { ChargeRequest, ChargeResponse } from '../types/snailpay.types'
import type { User } from '../types/user.types'
import { snailpayService } from './snailpay.service'
import { storageService } from './storage.service'

const MESSAGES = {
  timeout: 'SnailPay tardó demasiado en responder. No se aplicó ninguna recarga; intenta de nuevo en unos minutos.',
  network_error: 'No se pudo conectar con SnailPay. Revisa tu conexión e intenta de nuevo.',
  invalid_response: 'SnailPay respondió con datos inesperados. No se aplicó ninguna recarga.',
  mismatch: 'La respuesta de SnailPay no corresponde a esta recarga. No se aplicó ningún cambio al saldo.',
  storage: 'El pago se aprobó, pero no se pudo guardar el saldo en este navegador. Revisa el almacenamiento local.',
} as const

// Suma en centavos: 0.1 + 0.2 con decimales da 0.30000000000000004.
function addMoney(a: number, b: number): number {
  return Math.round(a * 100 + b * 100) / 100
}

function toChargeRequest(user: User, input: RechargeInput): ChargeRequest {
  return {
    card_number: input.cardNumber.replace(/\s/g, ''),
    expiration_date: input.expirationDate.trim(),
    cvv: input.cvv.trim(),
    cardholder_name: input.cardholderName.trim(),
    amount: input.amount,
    payer_id: user.id,
    payer_email: user.email,
  }
}

// Una aprobación solo se acredita si es para este usuario y por el monto solicitado:
// así una respuesta equivocada nunca genera un cobro exitoso falso.
function matchesRequest(response: ChargeResponse, request: ChargeRequest): boolean {
  return response.payer_id === request.payer_id && response.transaction_amount === request.amount
}

function applyApprovedCharge(userId: string, amount: number, message: string): RechargeOutcome {
  // Se relee el usuario guardado para sumar sobre el saldo más reciente, no sobre una copia vieja.
  const stored = storageService.getUsers().find((user) => user.id === userId)
  if (!stored) return { ok: false, message: MESSAGES.storage }

  const updated = { ...stored, balance: addMoney(stored.balance, amount) }
  if (!storageService.saveUser(updated)) return { ok: false, message: MESSAGES.storage }
  return { ok: true, user: updated, message }
}

export const rechargeService = {
  async recharge(user: User, input: RechargeInput): Promise<RechargeOutcome> {
    const request = toChargeRequest(user, input)
    const result = await snailpayService.charge(request)

    if (result.kind !== 'response') return { ok: false, message: MESSAGES[result.kind] }

    const { response } = result
    // Todas las respuestas se guardan en el historial, incluidas las rechazadas.
    storageService.addRecharge(response)

    if (response.status !== 'approved') return { ok: false, message: response.message }
    if (!matchesRequest(response, request)) return { ok: false, message: MESSAGES.mismatch }
    return applyApprovedCharge(user.id, response.transaction_amount, response.message)
  },

  getHistory(userId: string): ChargeResponse[] {
    return storageService.getRecharges().filter((recharge) => recharge.payer_id === userId)
  },
}
