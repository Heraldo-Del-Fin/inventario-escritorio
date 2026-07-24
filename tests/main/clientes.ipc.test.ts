import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/ipc-channels'
import type { Cliente } from '@shared/types'
import { createIpcMainMock } from '../helpers/mockIpc'
import { createLocalStoreMock } from '../helpers/mockLocalStore'

const ipc = createIpcMainMock()
const store = createLocalStoreMock()

vi.mock('electron', () => ({ ipcMain: ipc.ipcMain }))
vi.mock('@main/store/localStore', () => ({
  readCollection: store.readCollection,
  writeCollection: store.writeCollection
}))

const { registerClientesIpc } = await import('@main/ipc/clientes.ipc')

describe('clientes.ipc', () => {
  beforeEach(() => {
    store.reset()
    registerClientesIpc()
  })

  it('siembra un "Cliente general" al registrar el módulo', async () => {
    const clientes = await ipc.invoke<Cliente[]>(IpcChannels.CLIENTES_LISTAR)
    expect(clientes).toHaveLength(1)
    expect(clientes[0].esGeneral).toBe(true)
  })

  it('el seed es idempotente: registrar de nuevo no duplica el general', async () => {
    registerClientesIpc()
    registerClientesIpc()
    const clientes = await ipc.invoke<Cliente[]>(IpcChannels.CLIENTES_LISTAR)
    expect(clientes).toHaveLength(1)
  })

  it('no deja eliminar el cliente general', async () => {
    const [general] = await ipc.invoke<Cliente[]>(IpcChannels.CLIENTES_LISTAR)
    await expect(ipc.invoke(IpcChannels.CLIENTES_ELIMINAR, general.id)).rejects.toThrowError(
      /no se puede eliminar el cliente general/i
    )
  })

  it('sí deja eliminar un cliente normal', async () => {
    const cliente = await ipc.invoke<Cliente>(IpcChannels.CLIENTES_CREAR, { nombre: 'Juan' })
    await ipc.invoke(IpcChannels.CLIENTES_ELIMINAR, cliente.id)
    const clientes = await ipc.invoke<Cliente[]>(IpcChannels.CLIENTES_LISTAR)
    expect(clientes.find((c) => c.id === cliente.id)).toBeUndefined()
  })
})
