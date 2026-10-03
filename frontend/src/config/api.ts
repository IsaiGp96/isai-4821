// URL del backend. Se puede cambiar con VITE_API_URL sin tocar el código (por ejemplo, al desplegar).
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Si SnailPay no responde en este tiempo se cancela la petición y no se aplica ninguna recarga.
export const SNAILPAY_TIMEOUT_MS = 5_000
