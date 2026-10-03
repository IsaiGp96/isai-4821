// PBKDF2 con Web Crypto: viene en el navegador, no requiere dependencias.
// 600,000 iteraciones con SHA-256 es la recomendación de OWASP; hace costoso probar contraseñas por fuerza bruta.
const ITERATIONS = 600_000
const HASH_ALGORITHM = 'SHA-256'
const SALT_BYTES = 16
const KEY_BITS = 256

export interface PasswordHash {
  hash: string
  salt: string
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: HASH_ALGORITHM },
    key,
    KEY_BITS,
  )
  return new Uint8Array(bits)
}

// Recorre todos los bytes aunque encuentre una diferencia: el tiempo de respuesta
// no revela cuántos bytes coinciden.
function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export const passwordService = {
  // Cada contraseña lleva su propia sal: dos usuarios con la misma contraseña tienen hashes distintos.
  async hash(password: string): Promise<PasswordHash> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
    const hash = await derive(password, salt)
    return { hash: toBase64(hash), salt: toBase64(salt) }
  },

  async verify(password: string, stored: PasswordHash): Promise<boolean> {
    try {
      const hash = await derive(password, fromBase64(stored.salt))
      return equalBytes(hash, fromBase64(stored.hash))
    } catch {
      // Hash o sal que no son base64 válido: se trata como contraseña incorrecta.
      return false
    }
  },
}
