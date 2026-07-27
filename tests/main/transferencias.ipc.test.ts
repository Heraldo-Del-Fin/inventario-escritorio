import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/ipc-channels'
import type { Transferencia } from '@shared/types'
import { createIpcMainMock } from '../helpers/mockIpc'

const ipc = createIpcMainMock()
const apiClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }

vi.mock('electron', () => ({ ipcMain: ipc.ipcMain }))
vi.mock('@main/api/client', () => ({ apiClient }))

const { registerTransferenciasIpc } = await import('@main/ipc/transferencias.ipc')

const transferencia: Transferencia = {
  id: 't1',
  productoId: 'p1',
  sucursalOrigenId: 's1',
  sucursalDestinoId: 's2',
  cantidad: 5,
  creadoEn: '2026-01-01T00:00:00.000Z'
}

describe('transferencias.ipc', () => {
  beforeEach(() => {
    apiClient.get.mockReset()
    apiClient.post.mockReset()
    registerTransferenciasIpc()
  })

  it('listar pide un límite alto y devuelve solo los datos (no la paginación)', async () => {
    apiClient.get.mockResolvedValue({ datos: [transferencia], total: 1, page: 1, limit: 100 })

    const resultado = await ipc.invoke<Transferencia[]>(IpcChannels.TRANSFERENCIAS_LISTAR)

    expect(apiClient.get).toHaveBeenCalledWith('/transferencias?limit=100')
    expect(resultado).toEqual([transferencia])
  })

  it('crear genera el id y la fecha acá (la API los requiere) y los manda junto con los datos', async () => {
    apiClient.post.mockResolvedValue(transferencia)

    await ipc.invoke(IpcChannels.TRANSFERENCIAS_CREAR, {
      productoId: 'p1',
      sucursalOrigenId: 's1',
      sucursalDestinoId: 's2',
      cantidad: 5
    })

    expect(apiClient.post).toHaveBeenCalledWith(
      '/transferencias',
      expect.objectContaining({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        productoId: 'p1',
        sucursalOrigenId: 's1',
        sucursalDestinoId: 's2',
        cantidad: 5,
        creadoEn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      })
    )
  })
})
