import { STORAGE_KEYS, type StorageKey } from '../config/storage'
import { isChargeResponse, isRecord } from '../lib/guards'
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

function isUserList(value: unknown): value is User[] {
  return Array.isArray(value) && value.every(isUser)
}

function isSession(value: unknown): value is Session {
  return (
    isRecord(value) &&
    typeof value.userId === 'string' &&
    typeof value.startedAt === 'string'
  )
}

function isRechargeList(value: unknown): value is Recharge[] {
  return Array.isArray(value) && value.every(isChargeResponse)
}

export const storageService = {
  getUsers: () => read(STORAGE_KEYS.users, isUserList) ?? [],
  // Reemplaza al usuario con el mismo id (p. ej. al actualizar su saldo) o lo agrega al final.
  saveUser: (user: User) => {
    const users = storageService.getUsers()
    const exists = users.some((stored) => stored.id === user.id)
    const next = exists
      ? users.map((stored) => (stored.id === user.id ? user : stored))
      : [...users, user]
    return write(STORAGE_KEYS.users, next)
  },

  getSession: () => read(STORAGE_KEYS.session, isSession),
  saveSession: (session: Session) => write(STORAGE_KEYS.session, session),
  clearSession: () => remove(STORAGE_KEYS.session),

  getRecharges: () => read(STORAGE_KEYS.recharges, isRechargeList) ?? [],
  addRecharge: (recharge: Recharge) =>
    write(STORAGE_KEYS.recharges, [...storageService.getRecharges(), recharge]),
}
