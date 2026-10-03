import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rechargeService } from '../src/services/recharge.service'
import { snailpayService, type ChargeResult } from '../src/services/snailpay.service'
import { storageService } from '../src/services/storage.service'
import type { RechargeInput } from '../src/types/recharge.types'
import type { ChargeResponse } from '../src/types/snailpay.types'
import type { User } from '../src/types/user.types'

const user: User = {
  id: 'user-1',
  fullName: 'Ana López',
  email: 'ana@correo.com',
  passwordHash: 'hash',
  passwordSalt: 'salt',
  balance: 0,
}

const input: RechargeInput = {
  cardNumber: '1234 1234 1234 1234',
  expirationDate: '12/26',
  cvv: '543',
  cardholderName: 'Ana López',
  amount: 150,
}

const approved: ChargeResponse = {
  id: 'charge-1',
  status: 'approved',
  status_detail: 'accredited',
  message: 'Pago aprobado. El saldo se acreditó a tu cuenta.',
  transaction_amount: 150,
  date_created: '2026-10-02T12:00:00.000Z',
  authorization_code: '123456',
  reference: 'SP-20261002-ABC123',
  payer_id: 'user-1',
  payer_email: 'ana@correo.com',
  card_number: '1234123412341234',
  cvv: '543',
}

const rejected: ChargeResponse = {
  ...approved,
  id: 'charge-2',
  status: 'rejected',
  status_detail: 'insufficient_funds',
  message: 'La tarjeta no tiene fondos suficientes.',
  authorization_code: null,
}

function mockCharge(result: ChargeResult) {
  return vi.spyOn(snailpayService, 'charge').mockResolvedValue(result)
}

function storedBalance(): number | undefined {
  return storageService.getUsers().find((stored) => stored.id === user.id)?.balance
}

beforeEach(() => {
  localStorage.clear()
  storageService.saveUser(user)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('rechargeService - cobro aprobado', () => {
  it('suma el monto al saldo y lo guarda', async () => {
    mockCharge({ kind: 'response', response: approved })

    const outcome = await rechargeService.recharge(user, input)

    expect(outcome).toEqual({
      ok: true,
      user: { ...user, balance: 150 },
      message: 'Pago aprobado. El saldo se acreditó a tu cuenta.',
    })
    expect(storedBalance()).toBe(150)
  })

  it('envía el id y el correo del usuario, y el número de tarjeta sin espacios', async () => {
    const charge = mockCharge({ kind: 'response', response: approved })

    await rechargeService.recharge(user, input)

    expect(charge).toHaveBeenCalledWith(
      expect.objectContaining({
        card_number: '1234123412341234',
        payer_id: 'user-1',
        payer_email: 'ana@correo.com',
      }),
    )
  })

  it('guarda la recarga con número de tarjeta y CVV', async () => {
    mockCharge({ kind: 'response', response: approved })

    await rechargeService.recharge(user, input)

    expect(rechargeService.getHistory(user.id)).toEqual([approved])
  })

  it('acumula recargas sin errores de decimales', async () => {
    mockCharge({ kind: 'response', response: { ...approved, transaction_amount: 0.1 } })
    await rechargeService.recharge(user, { ...input, amount: 0.1 })

    mockCharge({ kind: 'response', response: { ...approved, transaction_amount: 0.2 } })
    await rechargeService.recharge(user, { ...input, amount: 0.2 })

    expect(storedBalance()).toBe(0.3)
  })

  it('suma sobre el saldo guardado aunque la copia del usuario esté desactualizada', async () => {
    storageService.saveUser({ ...user, balance: 500 })
    mockCharge({ kind: 'response', response: approved })

    await rechargeService.recharge(user, input)

    expect(storedBalance()).toBe(650)
  })
})

describe('rechargeService - el saldo no cambia', () => {
  it('con un cobro rechazado, y muestra el mensaje de SnailPay', async () => {
    mockCharge({ kind: 'response', response: rejected })

    const outcome = await rechargeService.recharge(user, input)

    expect(outcome).toEqual({ ok: false, message: 'La tarjeta no tiene fondos suficientes.' })
    expect(storedBalance()).toBe(0)
    expect(rechargeService.getHistory(user.id)).toEqual([rejected])
  })

  it('con un error del sistema', async () => {
    const error: ChargeResponse = { ...rejected, status: 'error', status_detail: 'service_unavailable' }
    mockCharge({ kind: 'response', response: error })

    const outcome = await rechargeService.recharge(user, input)

    expect(outcome.ok).toBe(false)
    expect(storedBalance()).toBe(0)
  })

  it.each([
    ['timeout', 'SnailPay tardó demasiado'],
    ['network_error', 'No se pudo conectar'],
    ['invalid_response', 'datos inesperados'],
  ] as const)('con %s, sin guardar nada en el historial', async (kind, message) => {
    mockCharge({ kind })

    const outcome = await rechargeService.recharge(user, input)

    expect(outcome.ok).toBe(false)
    expect(outcome.message).toContain(message)
    expect(storedBalance()).toBe(0)
    expect(storageService.getRecharges()).toEqual([])
  })

  it.each([
    ['otro monto', { ...approved, transaction_amount: 9999 }],
    ['otro usuario', { ...approved, payer_id: 'user-2' }],
  ])('si la aprobación es por %s', async (_case, response) => {
    mockCharge({ kind: 'response', response })

    const outcome = await rechargeService.recharge(user, input)

    expect(outcome.ok).toBe(false)
    expect(storedBalance()).toBe(0)
  })
})

describe('rechargeService - historial', () => {
  it('muestra solo las recargas del usuario', async () => {
    storageService.addRecharge({ ...approved, id: 'otra', payer_id: 'user-2' })
    mockCharge({ kind: 'response', response: approved })

    await rechargeService.recharge(user, input)

    expect(rechargeService.getHistory(user.id).map((recharge) => recharge.id)).toEqual(['charge-1'])
  })
})
