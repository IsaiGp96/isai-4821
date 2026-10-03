import type { AuthResult, LoginInput, RegisterInput } from '../types/auth.types'
import type { User } from '../types/user.types'
import { passwordService } from './password.service'
import { storageService } from './storage.service'

const MIN_PASSWORD_LENGTH = 8
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mismo mensaje si el correo no existe o la contraseña es incorrecta:
// así no se revela qué correos tienen cuenta.
const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos.'
const STORAGE_ERROR = 'No se pudo guardar la información. Revisa que el navegador permita el almacenamiento local.'

// Ana@Correo.com y ana@correo.com son la misma cuenta.
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function findByEmail(email: string): User | undefined {
  return storageService.getUsers().find((user) => user.email === email)
}

function validateRegister({ fullName, email, password, confirmPassword }: RegisterInput): string | null {
  if (fullName.trim() === '') return 'Ingresa tu nombre completo.'
  if (!EMAIL_PATTERN.test(email)) return 'Ingresa un correo válido.'
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (password !== confirmPassword) return 'Las contraseñas no coinciden.'
  return null
}

function startSession(user: User): AuthResult {
  const saved = storageService.saveSession({ userId: user.id, startedAt: new Date().toISOString() })
  return saved ? { ok: true, user } : { ok: false, error: STORAGE_ERROR }
}

export const authService = {
  // Al registrarse se inicia sesión de inmediato.
  async register(input: RegisterInput): Promise<AuthResult> {
    const email = normalizeEmail(input.email)
    const error = validateRegister({ ...input, email })
    if (error) return { ok: false, error }
    if (findByEmail(email)) return { ok: false, error: 'Ya existe una cuenta con ese correo.' }

    const { hash, salt } = await passwordService.hash(input.password)
    const user: User = {
      id: crypto.randomUUID(),
      fullName: input.fullName.trim(),
      email,
      passwordHash: hash,
      passwordSalt: salt,
      balance: 0,
    }
    if (!storageService.saveUser(user)) return { ok: false, error: STORAGE_ERROR }
    return startSession(user)
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = findByEmail(normalizeEmail(input.email))
    if (!user) return { ok: false, error: INVALID_CREDENTIALS }

    const valid = await passwordService.verify(input.password, {
      hash: user.passwordHash,
      salt: user.passwordSalt,
    })
    if (!valid) return { ok: false, error: INVALID_CREDENTIALS }
    return startSession(user)
  },

  logout(): void {
    storageService.clearSession()
  },

  getCurrentUser(): User | null {
    const session = storageService.getSession()
    if (!session) return null

    const user = storageService.getUsers().find((stored) => stored.id === session.userId)
    // Una sesión de un usuario que ya no existe no sirve: se borra.
    if (!user) storageService.clearSession()
    return user ?? null
  },
}
