import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/ipc-channels'
import type { Proveedor } from '@shared/types'
import { createIpcMainMock } from '../helpers/mockIpc'
import { createLocalStoreMock } from '../helpers/mockLocalStore'

const ipc = createIpcMainMock()
const store = createLocalStoreMock()

vi.mock('electron', () => ({ ipcMain: ipc.ipcMain }))
vi.mock('@main/store/localStore', () => ({
  readCollection: store.readCollection,
  writeCollection: store.writeCollection
}))

const { registerProveedoresIpc } = await import('@main/ipc/proveedores.ipc')

describe('proveedores.ipc', () => {
  beforeEach(() => {
    store.reset()
    registerProveedoresIpc()
  })

  it('siembra un "Proveedor general" al registrar el módulo', async () => {
    const proveedores = await ipc.invoke<Proveedor[]>(IpcChannels.PROVEEDORES_LISTAR)
    expect(proveedores).toHaveLength(1)
    expect(proveedores[0].esGeneral).toBe(true)
  })

  it('el seed es idempotente: registrar de nuevo no duplica el general', async () => {
    registerProveedoresIpc()
    registerProveedoresIpc()
    const proveedores = await ipc.invoke<Proveedor[]>(IpcChannels.PROVEEDORES_LISTAR)
    expect(proveedores).toHaveLength(1)
  })

  it('crea proveedores nuevos con esGeneral en false', async () => {
    const proveedor = await ipc.invoke<Proveedor>(IpcChannels.PROVEEDORES_CREAR, {
      nombre: 'Acme'
    })
    expect(proveedor.esGeneral).toBe(false)
  })

  it('no deja eliminar el proveedor general', async () => {
    const [general] = await ipc.invoke<Proveedor[]>(IpcChannels.PROVEEDORES_LISTAR)
    await expect(ipc.invoke(IpcChannels.PROVEEDORES_ELIMINAR, general.id)).rejects.toThrowError(
      /no se puede eliminar el proveedor general/i
    )
  })

  it('sí deja eliminar un proveedor normal', async () => {
    const proveedor = await ipc.invoke<Proveedor>(IpcChannels.PROVEEDORES_CREAR, {
      nombre: 'Acme'
    })
    await ipc.invoke(IpcChannels.PROVEEDORES_ELIMINAR, proveedor.id)
    const proveedores = await ipc.invoke<Proveedor[]>(IpcChannels.PROVEEDORES_LISTAR)
    expect(proveedores.find((p) => p.id === proveedor.id)).toBeUndefined()
  })

  it('actualizar no permite pisar la marca esGeneral desde el cliente', async () => {
    const [general] = await ipc.invoke<Proveedor[]>(IpcChannels.PROVEEDORES_LISTAR)

    await ipc.invoke(IpcChannels.PROVEEDORES_ACTUALIZAR, general.id, {
      nombre: 'Renombrado',
      esGeneral: false
    })

    const proveedores = await ipc.invoke<Proveedor[]>(IpcChannels.PROVEEDORES_LISTAR)
    expect(proveedores[0].nombre).toBe('Renombrado')
    expect(proveedores[0].esGeneral).toBe(true)
  })
})
