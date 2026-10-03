import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_URL } from '../src/config/api'
import { snailpayService } from '../src/services/snailpay.service'
import type { ChargeRequest, ChargeResponse } from '../src/types/snailpay.types'

const request: ChargeRequest = {
  card_number: '1234123412341234',
  expiration_date: '12/26',
  cvv: '543',
  cardholder_name: 'Ana López',
  amount: 150,
  payer_id: 'user-1',
  payer_email: 'ana@correo.com',
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

function mockFetch(implementation: (url: string, init: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn(implementation)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function jsonResponse(body: unknown, status: number): Promise<Response> {
  return Promise.resolve(new Response(JSON.stringify(body), { status }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('snailpayService - respuestas de SnailPay', () => {
  it('envía la petición por POST con JSON', async () => {
    const fetchMock = mockFetch(() => jsonResponse(approved, 200))

    await snailpayService.charge(request)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${API_URL}/api/snailpay/charges`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(request)
  })

  it.each([
    ['aprobado (200)', approved, 200],
    ['rechazado (422)', { ...approved, status: 'rejected', status_detail: 'insufficient_funds', authorization_code: null }, 422],
    ['error del sistema (503)', { ...approved, status: 'error', status_detail: 'service_unavailable', authorization_code: null }, 503],
  ])('devuelve la respuesta tal cual: %s', async (_case, body, status) => {
    mockFetch(() => jsonResponse(body, status))

    expect(await snailpayService.charge(request)).toEqual({ kind: 'response', response: body })
  })
})

describe('snailpayService - fallas de comunicación', () => {
  it('corta la petición cuando SnailPay no responde a tiempo', async () => {
    // Simula un servidor que nunca responde: la promesa solo termina cuando se cancela.
    mockFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Cancelada', 'AbortError')))
        }),
    )

    expect(await snailpayService.charge(request, 20)).toEqual({ kind: 'timeout' })
  })

  it('informa si no hay conexión con el servidor', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))

    expect(await snailpayService.charge(request)).toEqual({ kind: 'network_error' })
  })

  it('rechaza un cuerpo que no es JSON', async () => {
    mockFetch(() => Promise.resolve(new Response('<html>Error</html>', { status: 500 })))

    expect(await snailpayService.charge(request)).toEqual({ kind: 'invalid_response' })
  })

  it.each([
    ['un estado desconocido', { ...approved, status: 'pending' }],
    ['un monto como texto', { ...approved, transaction_amount: '150' }],
    ['el error genérico del servidor', { error: 'internal_error', message: 'Ocurrió un error inesperado.' }],
  ])('rechaza una respuesta con %s', async (_case, body) => {
    mockFetch(() => jsonResponse(body, 200))

    expect(await snailpayService.charge(request)).toEqual({ kind: 'invalid_response' })
  })
})
