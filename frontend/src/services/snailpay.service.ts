import { API_URL, SNAILPAY_TIMEOUT_MS } from '../config/api'
import { isChargeResponse } from '../lib/guards'
import type { ChargeRequest, ChargeResponse } from '../types/snailpay.types'

// SnailPay responde con el mismo formato en 200, 422 y 503; por eso no se decide por el código HTTP
// sino por el campo status. Los demás resultados son fallas de la comunicación, no de SnailPay.
export type ChargeResult =
  | { kind: 'response'; response: ChargeResponse }
  | { kind: 'timeout' }
  | { kind: 'network_error' }
  | { kind: 'invalid_response' }

export const snailpayService = {
  async charge(request: ChargeRequest, timeoutMs: number = SNAILPAY_TIMEOUT_MS): Promise<ChargeResult> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(`${API_URL}/api/snailpay/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      })
      const body: unknown = await res.json()
      return isChargeResponse(body) ? { kind: 'response', response: body } : { kind: 'invalid_response' }
    } catch (error) {
      if (controller.signal.aborted) return { kind: 'timeout' }
      // res.json() lanza SyntaxError si el cuerpo no es JSON (por ejemplo, una página de error HTML).
      if (error instanceof SyntaxError) return { kind: 'invalid_response' }
      return { kind: 'network_error' }
    } finally {
      clearTimeout(timer)
    }
  },
}
