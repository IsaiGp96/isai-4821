// URL del backend. Se puede cambiar con VITE_API_URL sin tocar el código (por ejemplo, al desplegar).
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Si SnailPay no responde en este tiempo se cancela la petición y no se aplica ninguna recarga.
export const SNAILPAY_TIMEOUT_MS = 5_000

// Copia del límite del backend (MAX_AMOUNT) solo para mostrarlo en el formulario; quien lo valida es SnailPay.
export const SNAILPAY_MAX_AMOUNT = 10_000
