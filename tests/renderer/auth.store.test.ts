import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/store/auth.store'
import type { Usuario } from '@shared/types'

const usuario: Usuario = {
  id: 'u1',
  nombre: 'Ana',
  email: 'ana@x.com',
  rol: 'VENDEDOR'
}

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.setState({ usuario: null, token: null })
  })

  it('empieza sin sesión', () => {
    expect(useAuthStore.getState().usuario).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('login guarda el usuario y el token', () => {
    useAuthStore.getState().login(usuario, 'token-123')
    expect(useAuthStore.getState().usuario).toEqual(usuario)
    expect(useAuthStore.getState().token).toBe('token-123')
  })

  it('logout limpia la sesión', () => {
    useAuthStore.getState().login(usuario, 'token-123')
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().usuario).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
  })
})
