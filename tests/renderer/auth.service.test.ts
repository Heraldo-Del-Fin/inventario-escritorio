import { beforeEach, describe, expect, it } from 'vitest'
import { installMockWindowApi } from '../helpers/mockWindowApi'
import { authService } from '@/services/auth.service'
import type { SesionAuth } from '@shared/types'

const sesion: SesionAuth = {
  usuario: { id: 'u1', nombre: 'Admin', email: 'admin@inventario.local', rol: 'ADMIN' },
  token: 'token-123'
}

describe('auth.service', () => {
  let api: ReturnType<typeof installMockWindowApi>

  beforeEach(() => {
    api = installMockWindowApi()
  })

  it('login delega las credenciales en window.api.auth.login', async () => {
    api.auth.login.mockResolvedValue(sesion)
    const credenciales = { email: 'admin@inventario.local', password: 'admin123' }
    await expect(authService.login(credenciales)).resolves.toEqual(sesion)
    expect(api.auth.login).toHaveBeenCalledWith(credenciales)
  })

  it('propaga el error si window.api.auth.login rechaza', async () => {
    api.auth.login.mockRejectedValue(new Error('Correo o contraseña incorrectos'))
    await expect(authService.login({ email: 'x@x.com', password: 'mal' })).rejects.toThrowError(
      /incorrectos/
    )
  })
})
