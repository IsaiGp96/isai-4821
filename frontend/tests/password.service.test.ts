import { describe, expect, it } from 'vitest'
import { passwordService } from '../src/services/password.service'

describe('passwordService - derivación', () => {
  it('no guarda la contraseña en texto plano', async () => {
    const stored = await passwordService.hash('Caracol123')

    expect(stored.hash).not.toContain('Caracol123')
    expect(stored.salt).not.toContain('Caracol123')
  })

  it('genera hashes distintos para la misma contraseña', async () => {
    const first = await passwordService.hash('Caracol123')
    const second = await passwordService.hash('Caracol123')

    expect(first.salt).not.toBe(second.salt)
    expect(first.hash).not.toBe(second.hash)
  })
})

describe('passwordService - verificación', () => {
  it('acepta la contraseña correcta', async () => {
    const stored = await passwordService.hash('Caracol123')

    expect(await passwordService.verify('Caracol123', stored)).toBe(true)
  })

  it.each([
    ['otra contraseña', 'Tortuga456'],
    ['mayúsculas distintas', 'caracol123'],
    ['un espacio extra', 'Caracol123 '],
    ['vacía', ''],
  ])('rechaza %s', async (_case, attempt) => {
    const stored = await passwordService.hash('Caracol123')

    expect(await passwordService.verify(attempt, stored)).toBe(false)
  })

  it('rechaza un hash guardado que no es base64 válido', async () => {
    const stored = await passwordService.hash('Caracol123')

    expect(await passwordService.verify('Caracol123', { ...stored, hash: '%%%' })).toBe(false)
  })
})
