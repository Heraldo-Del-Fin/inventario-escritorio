import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/ipc-channels'
import type { Sucursal } from '@shared/types'
import { createIpcMainMock } from '../helpers/mockIpc'

const ipc = createIpcMainMock()
const apiClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }

vi.mock('electron', () => ({ ipcMain: ipc.ipcMain }))
vi.mock('@main/api/client', async () => {
  const real = await vi.importActual<typeof import('@main/api/client')>('@main/api/client')
  return { ApiError: real.ApiError, apiClient }
})

const { registerSucursalesIpc } = await import('@main/ipc/sucursales.ipc')
const { ApiError } = await import('@main/api/client')

const sucursal: Sucursal = {
  id: 's1',
  nombre: 'Sucursal Norte',
  esPrincipal: false,
  creadoEn: '2026-01-01T00:00:00.000Z'
}

describe('sucursales.ipc', () => {
  beforeEach(() => {
    apiClient.get.mockReset()
    apiClient.post.mockReset()
    apiClient.patch.mockReset()
    apiClient.delete.mockReset()
    registerSucursalesIpc()
  })

  it('listar pide un límite alto y devuelve solo los datos (no la paginación)', async () => {
    apiClient.get.mockResolvedValue({ datos: [sucursal], total: 1, page: 1, limit: 100 })

    const resultado = await ipc.invoke<Sucursal[]>(IpcChannels.SUCURSALES_LISTAR)

    expect(apiClient.get).toHaveBeenCalledWith('/sucursales?limit=100')
    expect(resultado).toEqual([sucursal])
  })

  it('obtener devuelve la sucursal si existe', async () => {
    apiClient.get.mockResolvedValue(sucursal)
    const resultado = await ipc.invoke<Sucursal | null>(IpcChannels.SUCURSALES_OBTENER, 's1')
    expect(apiClient.get).toHaveBeenCalledWith('/sucursales/s1')
    expect(resultado).toEqual(sucursal)
  })

  it('obtener devuelve null si la API responde 404 (no propaga el error)', async () => {
    apiClient.get.mockRejectedValue(new ApiError('SUCURSAL_NO_ENCONTRADA', 'No existe', 404))
    const resultado = await ipc.invoke<Sucursal | null>(IpcChannels.SUCURSALES_OBTENER, 'no-existe')
    expect(resultado).toBeNull()
  })

  it('obtener propaga cualquier otro error (no lo confunde con "no encontrada")', async () => {
    apiClient.get.mockRejectedValue(new ApiError('ERROR_INTERNO', 'Falla de red', 500))
    await expect(ipc.invoke(IpcChannels.SUCURSALES_OBTENER, 's1')).rejects.toThrowError(
      /Falla de red/
    )
  })

  it('crear genera el id acá (la API lo requiere) y lo manda junto con el nombre', async () => {
    apiClient.post.mockResolvedValue(sucursal)

    await ipc.invoke(IpcChannels.SUCURSALES_CREAR, { nombre: 'Sucursal Norte' })

    expect(apiClient.post).toHaveBeenCalledWith(
      '/sucursales',
      expect.objectContaining({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        nombre: 'Sucursal Norte'
      })
    )
  })

  it('actualizar manda los cambios por PATCH', async () => {
    apiClient.patch.mockResolvedValue({ ...sucursal, nombre: 'Renombrada' })

    await ipc.invoke(IpcChannels.SUCURSALES_ACTUALIZAR, 's1', { nombre: 'Renombrada' })

    expect(apiClient.patch).toHaveBeenCalledWith('/sucursales/s1', { nombre: 'Renombrada' })
  })

  it('eliminar llama DELETE', async () => {
    apiClient.delete.mockResolvedValue(undefined)
    await ipc.invoke(IpcChannels.SUCURSALES_ELIMINAR, 's1')
    expect(apiClient.delete).toHaveBeenCalledWith('/sucursales/s1')
  })
})
