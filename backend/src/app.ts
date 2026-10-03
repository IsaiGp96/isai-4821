import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { createSnailPayRouter, type SnailPayRouterOptions } from './api/snailpay.routes.js';
import { env } from './config/env.js';

export function createApp(snailPayOptions: SnailPayRouterOptions = {}) {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(
    '/api/snailpay',
    createSnailPayRouter({ systemFailure: env.snailpaySystemFailure, ...snailPayOptions }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: 'not_found', message: 'La ruta solicitada no existe.' });
  });

  app.use(handleError);

  return app;
}

// Sin este manejador, Express responde con HTML y el frontend no podría leer el error.
const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'invalid_json', message: 'El cuerpo de la solicitud no es JSON válido.' });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'internal_error', message: 'Ocurrió un error inesperado en el servidor.' });
};

// Punto de entrada en Vercel: detecta src/app.ts y usa la app exportada por defecto.
// Va al final porque createApp usa handleError, que se declara arriba.
export default createApp();
