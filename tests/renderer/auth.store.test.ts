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
    useAuthStore.setState({ usuario: null })
  })

  it('empieza sin sesión', () => {
    expect(useAuthStore.getState().usuario).toBeNull()
  })

  it('login guarda el usuario', () => {
    useAuthStore.getState().login(usuario)
    expect(useAuthStore.getState().usuario).toEqual(usuario)
  })

  it('logout limpia la sesión', () => {
    useAuthStore.getState().login(usuario)
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().usuario).toBeNull()
  })
})
