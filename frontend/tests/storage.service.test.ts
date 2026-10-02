import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../src/config/storage'
import { storageService } from '../src/services/storage.service'
import type { Session } from '../src/types/session.types'
import type { Recharge } from '../src/types/snailpay.types'
import type { User } from '../src/types/user.types'

const user: User = {
  id: 'user-1',
  fullName: 'Ana López',
  email: 'ana@correo.com',
  passwordHash: 'hash',
  passwordSalt: 'salt',
  balance: 0,
}

const session: Session = { userId: 'user-1', startedAt: '2026-10-01T12:00:00.000Z' }

const recharge: Recharge = {
  id: 'charge-1',
  status: 'approved',
  status_detail: 'accredited',
  message: 'Pago aprobado.',
  transaction_amount: 150.5,
  date_created: '2026-10-01T12:00:00.000Z',
  authorization_code: '123456',
  reference: 'SP-20261001-ABC123',
  payer_id: 'user-1',
  payer_email: 'ana@correo.com',
  card_number: '1234123412341234',
  cvv: '543',
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('storageService - guardar y leer', () => {
  it('guarda y recupera el usuario', () => {
    expect(storageService.saveUser(user)).toBe(true)
    expect(storageService.getUser()).toEqual(user)
  })

  it('guarda, recupera y borra la sesión', () => {
    storageService.saveSession(session)
    expect(storageService.getSession()).toEqual(session)

    storageService.clearSession()
    expect(storageService.getSession()).toBeNull()
  })

  it('agrega recargas al historial conservando las anteriores', () => {
    const second = { ...recharge, id: 'charge-2' }

    storageService.addRecharge(recharge)
    storageService.addRecharge(second)

    expect(storageService.getRecharges()).toEqual([recharge, second])
  })

  it('guarda el número de tarjeta y el CVV de cada recarga', () => {
    storageService.addRecharge(recharge)

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.recharges) ?? '[]')
    expect(stored[0]).toMatchObject({ card_number: '1234123412341234', cvv: '543' })
  })
})

describe('storageService - datos inexistentes', () => {
  it('devuelve null sin usuario ni sesión guardados', () => {
    expect(storageService.getUser()).toBeNull()
    expect(storageService.getSession()).toBeNull()
  })

  it('devuelve un historial vacío sin recargas guardadas', () => {
    expect(storageService.getRecharges()).toEqual([])
  })
})

describe('storageService - datos corruptos', () => {
  it('ignora JSON inválido', () => {
    localStorage.setItem(STORAGE_KEYS.user, '{"id": ')

    expect(storageService.getUser()).toBeNull()
  })

  it.each([
    ['sin contraseña derivada', { ...user, passwordHash: undefined }],
    ['saldo negativo', { ...user, balance: -100 }],
    ['saldo como texto', { ...user, balance: '100' }],
    ['un arreglo', [user]],
  ])('rechaza un usuario con %s', (_case, stored) => {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(stored))

    expect(storageService.getUser()).toBeNull()
  })

  it('rechaza una sesión sin usuario', () => {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ startedAt: session.startedAt }))

    expect(storageService.getSession()).toBeNull()
  })

  it('descarta todo el historial si una recarga es inválida', () => {
    const corrupt = { ...recharge, transaction_amount: 'mucho' }
    localStorage.setItem(STORAGE_KEYS.recharges, JSON.stringify([recharge, corrupt]))

    expect(storageService.getRecharges()).toEqual([])
  })
})

describe('storageService - errores del navegador', () => {
  it('devuelve false si el navegador rechaza la escritura', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Cuota llena', 'QuotaExceededError')
    })

    expect(storageService.saveUser(user)).toBe(false)
  })

  it('devuelve null si el navegador bloquea la lectura', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Bloqueado', 'SecurityError')
    })

    expect(storageService.getUser()).toBeNull()
  })
})
