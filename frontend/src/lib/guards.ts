import type { ChargeResponse, ChargeStatus } from '../types/snailpay.types'

// Validadores de datos que llegan sin tipo (LocalStorage o red). Lo que no pasa se trata como inválido.

const CHARGE_STATUSES: readonly ChargeStatus[] = ['approved', 'rejected', 'error']

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isChargeResponse(value: unknown): value is ChargeResponse {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    CHARGE_STATUSES.includes(value.status as ChargeStatus) &&
    typeof value.status_detail === 'string' &&
    typeof value.message === 'string' &&
    typeof value.transaction_amount === 'number' &&
    Number.isFinite(value.transaction_amount) &&
    typeof value.date_created === 'string' &&
    (typeof value.authorization_code === 'string' || value.authorization_code === null) &&
    typeof value.reference === 'string' &&
    typeof value.payer_id === 'string' &&
    typeof value.payer_email === 'string' &&
    typeof value.card_number === 'string' &&
    typeof value.cvv === 'string'
  )
}
