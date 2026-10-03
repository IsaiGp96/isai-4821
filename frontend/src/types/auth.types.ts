import type { User } from './user.types'

export interface RegisterInput {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginInput {
  email: string
  password: string
}

// Los errores esperados (correo repetido, contraseña incorrecta) se devuelven, no se lanzan:
// la vista solo tiene que mostrar el mensaje.
export type AuthResult = { ok: true; user: User } | { ok: false; error: string }
