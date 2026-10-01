export const env = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  // Con "true", SnailPay responde a todas las solicitudes como error del sistema.
  snailpaySystemFailure: process.env.SNAILPAY_SYSTEM_FAILURE === 'true',
} as const;
