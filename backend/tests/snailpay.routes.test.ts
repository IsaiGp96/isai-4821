import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { TEST_CARDS } from '../src/api/snailpay.logic.js';

const CHARGES_URL = '/api/snailpay/charges';

const validBody = {
  ...TEST_CARDS.approved,
  cardholder_name: 'Ana López',
  amount: 150.5,
  payer_id: 'user-1',
  payer_email: 'ana@correo.com',
};

describe('POST /api/snailpay/charges - códigos HTTP', () => {
  it('responde 200 con el cobro aprobado', async () => {
    const response = await request(createApp()).post(CHARGES_URL).send(validBody);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('approved');
    expect(response.body.authorization_code).toMatch(/^\d{6}$/);
  });

  it('responde 422 cuando la transacción es rechazada', async () => {
    const response = await request(createApp())
      .post(CHARGES_URL)
      .send({ ...validBody, cvv: '000' });

    expect(response.status).toBe(422);
    expect(response.body.status_detail).toBe('cvv_mismatch');
    expect(response.body.authorization_code).toBeNull();
  });

  it('responde 422 cuando no se envía body', async () => {
    const response = await request(createApp()).post(CHARGES_URL);

    expect(response.status).toBe(422);
    expect(response.body.status_detail).toBe('invalid_card_number');
  });

  it('responde 503 con la tarjeta de error del sistema', async () => {
    const response = await request(createApp())
      .post(CHARGES_URL)
      .send({ ...validBody, card_number: TEST_CARDS.systemError });

    expect(response.status).toBe(503);
    expect(response.body.status_detail).toBe('service_unavailable');
  });
});

describe('POST /api/snailpay/charges - error del sistema', () => {
  it('no aprueba una tarjeta válida mientras la falla está activa', async () => {
    const response = await request(createApp({ systemFailure: true }))
      .post(CHARGES_URL)
      .send(validBody);

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('error');
    expect(response.body.authorization_code).toBeNull();
  });
});

describe('POST /api/snailpay/charges - timeout', () => {
  it('retrasa la respuesta de la tarjeta de timeout y no aprueba el cobro', async () => {
    const delayMs = 200;
    const app = createApp({ timeoutDelayMs: delayMs });
    const startedAt = Date.now();

    const response = await request(app)
      .post(CHARGES_URL)
      .send({ ...validBody, card_number: TEST_CARDS.timeout });

    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(delayMs - 10);
    expect(response.status).toBe(503);
    expect(response.body.authorization_code).toBeNull();
  });

  it('corta la petición si el cliente deja de esperar', async () => {
    const app = createApp({ timeoutDelayMs: 1_000 });

    const pending = request(app)
      .post(CHARGES_URL)
      .send({ ...validBody, card_number: TEST_CARDS.timeout })
      .timeout(100);

    await expect(pending).rejects.toMatchObject({ timeout: 100 });
  });
});

describe('Errores generales de la API', () => {
  it('responde 400 en JSON cuando el body no es JSON válido', async () => {
    const response = await request(createApp())
      .post(CHARGES_URL)
      .set('Content-Type', 'application/json')
      .send('{"card_number": ');

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.error).toBe('invalid_json');
  });

  it('responde 404 en JSON cuando la ruta no existe', async () => {
    const response = await request(createApp()).get('/api/no-existe');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('not_found');
  });
});
