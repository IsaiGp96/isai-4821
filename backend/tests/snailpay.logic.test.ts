import { describe, expect, it } from 'vitest';
import { MAX_AMOUNT, TEST_CARDS, processCharge } from '../src/api/snailpay.logic.js';
import type { ChargeRequest } from '../src/api/snailpay.types.js';

const validRequest: ChargeRequest = {
  ...TEST_CARDS.approved,
  cardholder_name: 'Ana López',
  amount: 150.5,
  payer_id: 'user-1',
  payer_email: 'ana@correo.com',
};

function charge(overrides: Partial<Record<keyof ChargeRequest, unknown>> = {}) {
  return processCharge({ ...validRequest, ...overrides });
}

describe('processCharge - cobro exitoso', () => {
  it('aprueba la tarjeta de prueba con fecha y CVV correctos', () => {
    const response = charge();

    expect(response.status).toBe('approved');
    expect(response.status_detail).toBe('accredited');
    expect(response.transaction_amount).toBe(150.5);
    expect(response.authorization_code).toMatch(/^\d{6}$/);
  });

  it('devuelve todos los campos requeridos con datos del usuario y la tarjeta', () => {
    const response = charge();

    expect(response).toMatchObject({
      payer_id: 'user-1',
      payer_email: 'ana@correo.com',
      card_number: TEST_CARDS.approved.card_number,
      cvv: TEST_CARDS.approved.cvv,
    });
    expect(response.id).toBeTruthy();
    expect(response.reference).toMatch(/^SP-\d{8}-[0-9A-F]{6}$/);
    expect(new Date(response.date_created).toISOString()).toBe(response.date_created);
  });

  it('acepta el monto máximo y montos con dos decimales', () => {
    expect(charge({ amount: MAX_AMOUNT }).status).toBe('approved');
    expect(charge({ amount: 10.1 }).status).toBe('approved');
  });

  it('genera un id distinto en cada operación', () => {
    expect(charge().id).not.toBe(charge().id);
  });
});

describe('processCharge - error en la transacción', () => {
  it.each([
    ['otra fecha en la tarjeta aprobada', { expiration_date: '11/26' }, 'cvv_mismatch'],
    ['otro CVV en la tarjeta aprobada', { cvv: '111' }, 'cvv_mismatch'],
    ['tarjeta sin fondos', { card_number: TEST_CARDS.insufficientFunds }, 'insufficient_funds'],
    ['tarjeta desconocida', { card_number: '5555555555555555' }, 'card_declined'],
  ])('rechaza %s', (_case, overrides, expectedDetail) => {
    const response = charge(overrides);

    expect(response.status).toBe('rejected');
    expect(response.status_detail).toBe(expectedDetail);
    expect(response.authorization_code).toBeNull();
  });
});

describe('processCharge - validación de datos', () => {
  it.each([
    ['tarjeta con menos de 16 dígitos', { card_number: '123412341234' }, 'invalid_card_number'],
    ['tarjeta con letras', { card_number: '1234abcd12341234' }, 'invalid_card_number'],
    ['fecha sin formato MM/AA', { expiration_date: '2026-12' }, 'invalid_expiration_date'],
    ['mes inexistente', { expiration_date: '13/26' }, 'invalid_expiration_date'],
    ['CVV de 4 dígitos', { cvv: '5432' }, 'invalid_cvv'],
    ['nombre vacío', { cardholder_name: '   ' }, 'invalid_cardholder_name'],
    ['monto en cero', { amount: 0 }, 'invalid_amount'],
    ['monto negativo', { amount: -50 }, 'invalid_amount'],
    ['monto con tres decimales', { amount: 10.123 }, 'invalid_amount'],
    ['monto como texto', { amount: '100' }, 'invalid_amount'],
    ['monto mayor al límite', { amount: MAX_AMOUNT + 1 }, 'amount_exceeds_limit'],
    ['usuario sin id', { payer_id: '' }, 'invalid_payer'],
    ['correo inválido', { payer_email: 'ana-correo.com' }, 'invalid_payer'],
  ])('rechaza %s', (_case, overrides, expectedDetail) => {
    const response = charge(overrides);

    expect(response.status).toBe('rejected');
    expect(response.status_detail).toBe(expectedDetail);
  });

  it.each([null, 'texto', 42, []])('rechaza un body que no es objeto (%j) sin lanzar error', (body) => {
    const response = processCharge(body);

    expect(response.status).toBe('rejected');
    expect(response.status_detail).toBe('invalid_card_number');
    expect(response.transaction_amount).toBe(0);
  });
});

describe('processCharge - error del sistema', () => {
  it('falla con la tarjeta de error del sistema', () => {
    const response = charge({ card_number: TEST_CARDS.systemError });

    expect(response.status).toBe('error');
    expect(response.status_detail).toBe('service_unavailable');
    expect(response.authorization_code).toBeNull();
  });

  it('no aprueba la tarjeta válida cuando se simula una falla interna', () => {
    const response = processCharge(validRequest, { systemFailure: true });

    expect(response.status).toBe('error');
    expect(response.status_detail).toBe('service_unavailable');
  });
});

describe('processCharge - mensajes', () => {
  it('incluye un mensaje para el usuario en cada resultado', () => {
    const responses = [
      charge(),
      charge({ cvv: '111' }),
      charge({ card_number: TEST_CARDS.systemError }),
    ];

    for (const response of responses) {
      expect(response.message.length).toBeGreaterThan(0);
    }
  });
});
