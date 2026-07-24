import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/ipc-channels'
import type { CambioPendiente, EstadoSincronizacion } from '@shared/types'
import { createIpcMainMock } from '../helpers/mockIpc'
import { createLocalStoreMock } from '../helpers/mockLocalStore'

const ipc = createIpcMainMock()
const store = createLocalStoreMock()

vi.mock('electron', () => ({ ipcMain: ipc.ipcMain }))
vi.mock('@main/store/localStore', () => ({
  readCollection: store.readCollection,
  writeCollection: store.writeCollection
}))

const { registerSyncIpc } = await import('@main/ipc/sync.ipc')
const { encolarCambio } = await import('@main/sync/outbox')
registerSyncIpc()

describe('sync.ipc', () => {
  beforeEach(() => {
    store.reset()
  })

  it('listar pendientes está vacío por defecto', async () => {
    expect(await ipc.invoke(IpcChannels.SYNC_LISTAR_PENDIENTES)).toEqual([])
  })

  it('estado refleja lo que hay encolado', async () => {
    encolarCambio('productos', 'CREAR', 'p1', { id: 'p1' })

    const estado = await ipc.invoke<EstadoSincronizacion>(IpcChannels.SYNC_ESTADO)
    expect(estado).toEqual({ pendientes: 1, conError: 0, sincronizados: 0 })
  })

  it('ejecutar sincronización procesa lo pendiente y lo refleja en listar/estado', async () => {
    encolarCambio('productos', 'CREAR', 'p1', { id: 'p1' })

    const resultado = await ipc.invoke<{ enviados: number; fallidos: number }>(
      IpcChannels.SYNC_EJECUTAR
    )
    expect(resultado.fallidos).toBe(1)

    const pendientes = await ipc.invoke<CambioPendiente[]>(IpcChannels.SYNC_LISTAR_PENDIENTES)
    expect(pendientes[0].estado).toBe('ERROR')
  })
})
