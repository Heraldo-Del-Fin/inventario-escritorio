import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/ipc-channels'
import type { SesionAuth } from '@shared/types'
import { createIpcMainMock } from '../helpers/mockIpc'
import { createLocalStoreMock } from '../helpers/mockLocalStore'

const ipc = createIpcMainMock()
const store = createLocalStoreMock()

vi.mock('electron', () => ({ ipcMain: ipc.ipcMain }))
vi.mock('@main/store/localStore', () => ({
  readCollection: store.readCollection,
  writeCollection: store.writeCollection
}))

const { registerAuthIpc } = await import('@main/ipc/auth.ipc')

describe('auth.ipc', () => {
  beforeEach(() => {
    store.reset()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    registerAuthIpc()
  })

  it('permite loguearse con el admin sembrado por defecto', async () => {
    const sesion = await ipc.invoke<SesionAuth>(IpcChannels.AUTH_LOGIN, {
      email: 'admin@inventario.local',
      password: 'admin123'
    })

    expect(sesion.usuario.email).toBe('admin@inventario.local')
    expect(sesion.usuario.rol).toBe('ADMIN')
    expect(sesion.usuario).not.toHaveProperty('passwordHash')
    expect(sesion.token).toBeTruthy()
  })

  it('rechaza una contraseña incorrecta', async () => {
    await expect(
      ipc.invoke(IpcChannels.AUTH_LOGIN, {
        email: 'admin@inventario.local',
        password: 'incorrecta'
      })
    ).rejects.toThrowError(/Correo o contraseña incorrectos/)
  })

  it('rechaza un email que no existe con el mismo mensaje genérico', async () => {
    await expect(
      ipc.invoke(IpcChannels.AUTH_LOGIN, {
        email: 'no-existe@x.com',
        password: 'lo-que-sea'
      })
    ).rejects.toThrowError(/Correo o contraseña incorrectos/)
  })
})
