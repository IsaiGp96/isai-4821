import { randomInt, randomUUID } from 'node:crypto';
import type {
  ChargeRequest,
  ChargeResponse,
  ChargeStatus,
  ChargeStatusDetail,
} from './snailpay.types.js';

// Tarjetas ficticias. Cada una produce un resultado documentado en el README.
export const TEST_CARDS = {
  approved: { card_number: '1234123412341234', expiration_date: '12/26', cvv: '543' },
  insufficientFunds: '4000000000009995',
  systemError: '9999999999999999',
  // Responde con retraso para que el frontend corte la petición por timeout.
  timeout: '4000000000000408',
} as const;

export const MAX_AMOUNT = 10_000;

const MESSAGES: Record<ChargeStatusDetail, string> = {
  accredited: 'Pago aprobado. El saldo se acreditó a tu cuenta.',
  invalid_card_number: 'El número de tarjeta debe tener 16 dígitos.',
  invalid_expiration_date: 'La fecha de vencimiento debe tener el formato MM/AA.',
  invalid_cvv: 'El CVV debe tener 3 dígitos.',
  invalid_cardholder_name: 'Escribe el nombre como aparece en la tarjeta.',
  invalid_amount: 'El monto debe ser mayor que cero y tener máximo dos decimales.',
  amount_exceeds_limit: `El monto máximo por recarga es de $${MAX_AMOUNT}.`,
  invalid_payer: 'No se pudo identificar al usuario. Inicia sesión de nuevo.',
  cvv_mismatch: 'Los datos de la tarjeta no coinciden. Revisa la fecha y el CVV.',
  insufficient_funds: 'La tarjeta no tiene fondos suficientes.',
  card_declined: 'La tarjeta fue rechazada. Intenta con otra tarjeta.',
  service_unavailable: 'SnailPay no está disponible en este momento. No se realizó ningún cargo.',
};

interface ChargeOptions {
  // Simula una falla interna de SnailPay sin importar los datos recibidos.
  systemFailure?: boolean;
}

export function processCharge(input: unknown, options: ChargeOptions = {}): ChargeResponse {
  const request = toChargeRequest(input);

  // La tarjeta de timeout responde con error: si la respuesta tardía llegara, no debe aprobar nada.
  const isSystemErrorCard =
    request.card_number === TEST_CARDS.systemError || request.card_number === TEST_CARDS.timeout;
  if (options.systemFailure || isSystemErrorCard) {
    return buildResponse(request, 'error', 'service_unavailable');
  }

  const validationError = validateChargeRequest(request);
  if (validationError) {
    return buildResponse(request, 'rejected', validationError);
  }

  return buildResponse(request, ...resolveCardResult(request));
}

export function validateChargeRequest(request: ChargeRequest): ChargeStatusDetail | null {
  if (!/^\d{16}$/.test(request.card_number)) return 'invalid_card_number';
  if (!isValidExpirationFormat(request.expiration_date)) return 'invalid_expiration_date';
  if (!/^\d{3}$/.test(request.cvv)) return 'invalid_cvv';
  if (request.cardholder_name.trim() === '') return 'invalid_cardholder_name';
  if (!isValidAmount(request.amount)) return 'invalid_amount';
  if (request.amount > MAX_AMOUNT) return 'amount_exceeds_limit';
  if (request.payer_id.trim() === '' || !isValidEmail(request.payer_email)) return 'invalid_payer';
  return null;
}

function resolveCardResult(request: ChargeRequest): [ChargeStatus, ChargeStatusDetail] {
  const { approved, insufficientFunds } = TEST_CARDS;

  if (request.card_number === approved.card_number) {
    const dataMatches =
      request.expiration_date === approved.expiration_date && request.cvv === approved.cvv;
    return dataMatches ? ['approved', 'accredited'] : ['rejected', 'cvv_mismatch'];
  }
  if (request.card_number === insufficientFunds) return ['rejected', 'insufficient_funds'];
  return ['rejected', 'card_declined'];
}

// No se compara contra la fecha actual: la tarjeta aprobada (12/26) debe seguir funcionando.
function isValidExpirationFormat(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  return month >= 1 && month <= 12;
}

// Máximo dos decimales. Se usa tolerancia porque 10.1 * 100 no da exactamente 1010.
function isValidAmount(amount: number): boolean {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  const cents = amount * 100;
  return Math.abs(cents - Math.round(cents)) < 1e-6;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// El body llega sin tipo desde la red. Los campos faltantes o de otro tipo se vuelven vacíos
// para que la validación los rechace con un status_detail claro.
function toChargeRequest(input: unknown): ChargeRequest {
  const body = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

  return {
    card_number: text(body.card_number),
    expiration_date: text(body.expiration_date),
    cvv: text(body.cvv),
    cardholder_name: text(body.cardholder_name),
    amount: typeof body.amount === 'number' ? body.amount : Number.NaN,
    payer_id: text(body.payer_id),
    payer_email: text(body.payer_email),
  };
}

function buildResponse(
  request: ChargeRequest,
  status: ChargeStatus,
  statusDetail: ChargeStatusDetail,
): ChargeResponse {
  const date = new Date();

  return {
    id: randomUUID(),
    status,
    status_detail: statusDetail,
    message: MESSAGES[statusDetail],
    transaction_amount: Number.isFinite(request.amount) ? request.amount : 0,
    date_created: date.toISOString(),
    authorization_code: status === 'approved' ? String(randomInt(100_000, 1_000_000)) : null,
    reference: buildReference(date),
    payer_id: request.payer_id,
    payer_email: request.payer_email,
    card_number: request.card_number,
    cvv: request.cvv,
  };
}

// Formato: SP-AAAAMMDD-XXXXXX
function buildReference(date: Date): string {
  const day = date.toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = randomUUID().slice(0, 6).toUpperCase();
  return `SP-${day}-${suffix}`;
}
