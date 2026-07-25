import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/ipc-channels'
import type { SesionAuth } from '@shared/types'
import { createIpcMainMock } from '../helpers/mockIpc'

const ipc = createIpcMainMock()
const apiClient = { post: vi.fn() }

vi.mock('electron', () => ({ ipcMain: ipc.ipcMain }))
vi.mock('@main/api/client', () => ({ apiClient }))

const { registerAuthIpc } = await import('@main/ipc/auth.ipc')
const { getSesion, limpiarSesion, setSesion } = await import('@main/api/session')

describe('auth.ipc', () => {
  beforeEach(() => {
    apiClient.post.mockReset()
    limpiarSesion()
    registerAuthIpc()
  })

  it('loguea contra la API y guarda la sesión en main (sin exponer los tokens al renderer)', async () => {
    apiClient.post.mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      usuario: { id: 'u1', nombre: 'Admin', email: 'admin@inventario.local', rol: 'ADMIN' }
    })

    const sesion = await ipc.invoke<SesionAuth>(IpcChannels.AUTH_LOGIN, {
      email: 'admin@inventario.local',
      password: 'admin123'
    })

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'admin@inventario.local',
      password: 'admin123'
    })
    expect(sesion).toEqual({
      usuario: { id: 'u1', nombre: 'Admin', email: 'admin@inventario.local', rol: 'ADMIN' }
    })
    expect(sesion).not.toHaveProperty('token')
    expect(getSesion()).toEqual({
      usuario: { id: 'u1', nombre: 'Admin', email: 'admin@inventario.local', rol: 'ADMIN' },
      accessToken: 'access-1',
      refreshToken: 'refresh-1'
    })
  })

  it('propaga el error de la API si las credenciales son inválidas', async () => {
    apiClient.post.mockRejectedValue(new Error('Correo o contraseña incorrectos'))

    await expect(
      ipc.invoke(IpcChannels.AUTH_LOGIN, { email: 'x@x.com', password: 'mal' })
    ).rejects.toThrowError(/Correo o contraseña incorrectos/)
    expect(getSesion()).toBeNull()
  })

  it('logout limpia la sesión de main', async () => {
    setSesion({
      usuario: { id: 'u1', nombre: 'Admin', email: 'a@x.com', rol: 'ADMIN' },
      accessToken: 'a',
      refreshToken: 'r'
    })

    await ipc.invoke(IpcChannels.AUTH_LOGOUT)

    expect(getSesion()).toBeNull()
  })
})
