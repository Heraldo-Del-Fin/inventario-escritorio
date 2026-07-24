import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '@main/auth/password'

describe('password', () => {
  it('verifica una contraseña correcta contra su hash', () => {
    const hash = hashPassword('admin123')
    expect(verifyPassword('admin123', hash)).toBe(true)
  })

  it('rechaza una contraseña incorrecta', () => {
    const hash = hashPassword('admin123')
    expect(verifyPassword('otra-cosa', hash)).toBe(false)
  })

  it('genera un salt distinto en cada llamada (dos hashes del mismo password no son iguales)', () => {
    const hash1 = hashPassword('admin123')
    const hash2 = hashPassword('admin123')
    expect(hash1).not.toBe(hash2)
    expect(verifyPassword('admin123', hash1)).toBe(true)
    expect(verifyPassword('admin123', hash2)).toBe(true)
  })

  it('devuelve false ante un string sin el formato "salt:hash"', () => {
    expect(verifyPassword('admin123', 'sin-separador')).toBe(false)
    expect(verifyPassword('admin123', '')).toBe(false)
  })
})
