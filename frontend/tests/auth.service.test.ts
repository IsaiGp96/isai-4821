import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '../src/services/auth.service'
import { storageService } from '../src/services/storage.service'

const input = { fullName: 'Ana López', email: 'ana@correo.com', password: 'Caracol123' }

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('authService - registro', () => {
  it('crea al usuario con saldo cero e inicia sesión', async () => {
    const result = await authService.register(input)

    expect(result.ok).toBe(true)
    expect(storageService.getUsers()).toHaveLength(1)
    expect(authService.getCurrentUser()).toMatchObject({
      fullName: 'Ana López',
      email: 'ana@correo.com',
      balance: 0,
    })
  })

  it('no guarda la contraseña en texto plano', async () => {
    await authService.register(input)

    expect(JSON.stringify(storageService.getUsers())).not.toContain('Caracol123')
  })

  it('normaliza el correo y el nombre', async () => {
    await authService.register({ ...input, fullName: '  Ana López ', email: ' Ana@Correo.COM ' })

    expect(storageService.getUsers()[0]).toMatchObject({
      fullName: 'Ana López',
      email: 'ana@correo.com',
    })
  })

  it('rechaza un correo ya registrado aunque cambien las mayúsculas', async () => {
    await authService.register(input)

    const result = await authService.register({ ...input, email: 'ANA@correo.com' })

    expect(result).toEqual({ ok: false, error: 'Ya existe una cuenta con ese correo.' })
    expect(storageService.getUsers()).toHaveLength(1)
  })

  it('permite registrar varios usuarios', async () => {
    await authService.register(input)
    await authService.register({ ...input, email: 'luis@correo.com' })

    expect(storageService.getUsers()).toHaveLength(2)
  })

  it.each([
    ['nombre vacío', { fullName: '   ' }, 'Ingresa tu nombre completo.'],
    ['correo sin dominio', { email: 'ana@' }, 'Ingresa un correo válido.'],
    ['correo con espacios', { email: 'ana lopez@correo.com' }, 'Ingresa un correo válido.'],
    ['contraseña corta', { password: '1234567' }, 'La contraseña debe tener al menos 8 caracteres.'],
  ])('rechaza %s', async (_case, change, error) => {
    const result = await authService.register({ ...input, ...change })

    expect(result).toEqual({ ok: false, error })
    expect(storageService.getUsers()).toEqual([])
  })

  it('informa si el navegador no permite guardar', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Cuota llena', 'QuotaExceededError')
    })

    const result = await authService.register(input)

    expect(result.ok).toBe(false)
    expect(authService.getCurrentUser()).toBeNull()
  })
})

describe('authService - inicio de sesión', () => {
  beforeEach(async () => {
    await authService.register(input)
    authService.logout()
  })

  it('inicia sesión con correo y contraseña correctos', async () => {
    const result = await authService.login({ email: 'ana@correo.com', password: 'Caracol123' })

    expect(result.ok).toBe(true)
    expect(authService.getCurrentUser()?.email).toBe('ana@correo.com')
  })

  it('acepta el correo con otras mayúsculas y espacios', async () => {
    const result = await authService.login({ email: ' ANA@correo.com ', password: 'Caracol123' })

    expect(result.ok).toBe(true)
  })

  it.each([
    ['contraseña incorrecta', { email: 'ana@correo.com', password: 'Tortuga456' }],
    ['correo no registrado', { email: 'luis@correo.com', password: 'Caracol123' }],
  ])('responde el mismo mensaje con %s', async (_case, credentials) => {
    const result = await authService.login(credentials)

    expect(result).toEqual({ ok: false, error: 'Correo o contraseña incorrectos.' })
    expect(authService.getCurrentUser()).toBeNull()
  })
})

describe('authService - sesión', () => {
  it('cierra la sesión', async () => {
    await authService.register(input)

    authService.logout()

    expect(authService.getCurrentUser()).toBeNull()
  })

  it('borra una sesión cuyo usuario ya no existe', () => {
    storageService.saveSession({ userId: 'no-existe', startedAt: '2026-10-02T12:00:00.000Z' })

    expect(authService.getCurrentUser()).toBeNull()
    expect(storageService.getSession()).toBeNull()
  })
})
