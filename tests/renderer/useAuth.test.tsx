import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import type { Usuario } from '@shared/types'

const usuario: Usuario = { id: 'u1', nombre: 'Ana', email: 'ana@x.com', rol: 'VENDEDOR' }

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({ usuario: null })
  })

  it('no está autenticado sin sesión', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.autenticado).toBe(false)
    expect(result.current.usuario).toBeNull()
  })

  it('login actualiza el hook (queda autenticado)', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.login(usuario)
    })

    expect(result.current.autenticado).toBe(true)
    expect(result.current.usuario).toEqual(usuario)
  })

  it('logout vuelve a dejarlo sin autenticar', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.login(usuario)
    })
    act(() => {
      result.current.logout()
    })

    expect(result.current.autenticado).toBe(false)
    expect(result.current.usuario).toBeNull()
  })
})
