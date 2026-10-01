import { Router } from 'express';
import { TEST_CARDS, processCharge } from './snailpay.logic.js';
import type { ChargeStatus } from './snailpay.types.js';

const HTTP_STATUS: Record<ChargeStatus, number> = {
  approved: 200,
  rejected: 422,
  error: 503,
};

export const TIMEOUT_DELAY_MS = 10_000;

export interface SnailPayRouterOptions {
  systemFailure?: boolean;
  // Configurable para que las pruebas no esperen el retraso real.
  timeoutDelayMs?: number;
}

export function createSnailPayRouter(options: SnailPayRouterOptions = {}) {
  const { systemFailure = false, timeoutDelayMs = TIMEOUT_DELAY_MS } = options;
  const router = Router();

  router.post('/charges', async (req, res) => {
    const response = processCharge(req.body, { systemFailure });

    if (response.card_number === TEST_CARDS.timeout) {
      await wait(timeoutDelayMs);
    }

    res.status(HTTP_STATUS[response.status]).json(response);
  });

  return router;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
