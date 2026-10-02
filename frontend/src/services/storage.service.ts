import { STORAGE_KEYS, type StorageKey } from '../config/storage'
import type { Session } from '../types/session.types'
import type { Recharge } from '../types/snailpay.types'
import type { User } from '../types/user.types'

// LocalStorage puede contener datos editados a mano o de una versión anterior de la app.
// Todo lo que se lee se valida antes de usarse; si no es válido se trata como inexistente.
function read<T>(key: StorageKey, isValid: (value: unknown) => value is T): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    const value: unknown = JSON.parse(raw)
    return isValid(value) ? value : null
  } catch {
    return null
  }
}

// Devuelve false si el navegador rechaza la escritura (cuota llena o almacenamiento bloqueado).
function write(key: StorageKey, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function remove(key: StorageKey): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Si el almacenamiento está bloqueado no hay nada que borrar.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.fullName === 'string' &&
    typeof value.email === 'string' &&
    typeof value.passwordHash === 'string' &&
    typeof value.passwordSalt === 'string' &&
    typeof value.balance === 'number' &&
    Number.isFinite(value.balance) &&
    value.balance >= 0
  )
}

function isSession(value: unknown): value is Session {
  return (
    isRecord(value) &&
    typeof value.userId === 'string' &&
    typeof value.startedAt === 'string'
  )
}

function isRecharge(value: unknown): value is Recharge {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.status === 'string' &&
    typeof value.status_detail === 'string' &&
    typeof value.transaction_amount === 'number' &&
    typeof value.date_created === 'string' &&
    typeof value.reference === 'string' &&
    typeof value.payer_id === 'string' &&
    typeof value.card_number === 'string' &&
    typeof value.cvv === 'string'
  )
}

function isRechargeList(value: unknown): value is Recharge[] {
  return Array.isArray(value) && value.every(isRecharge)
}

export const storageService = {
  getUser: () => read(STORAGE_KEYS.user, isUser),
  saveUser: (user: User) => write(STORAGE_KEYS.user, user),

  getSession: () => read(STORAGE_KEYS.session, isSession),
  saveSession: (session: Session) => write(STORAGE_KEYS.session, session),
  clearSession: () => remove(STORAGE_KEYS.session),

  getRecharges: () => read(STORAGE_KEYS.recharges, isRechargeList) ?? [],
  addRecharge: (recharge: Recharge) =>
    write(STORAGE_KEYS.recharges, [...storageService.getRecharges(), recharge]),
}
