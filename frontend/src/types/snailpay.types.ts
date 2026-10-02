// Fuente única: los tipos vienen del backend para que frontend y API no se desincronicen.
// `import type` se elimina al compilar, así que el build no incluye código del backend.
import type { ChargeResponse } from '../../../backend/src/api/snailpay.types'

export type {
  ChargeRequest,
  ChargeResponse,
  ChargeStatus,
  ChargeStatusDetail,
} from '../../../backend/src/api/snailpay.types'

// Una recarga es la respuesta de SnailPay tal como llega, incluidos card_number y cvv.
export type Recharge = ChargeResponse
