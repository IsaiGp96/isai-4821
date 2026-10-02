export interface User {
  id: string
  fullName: string
  email: string
  // La contraseña nunca se guarda en texto plano: solo su derivación con PBKDF2 y la sal usada.
  passwordHash: string
  passwordSalt: string
  balance: number
}
