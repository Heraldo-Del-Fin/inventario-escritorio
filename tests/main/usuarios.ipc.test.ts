import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/ipc-channels'
import type { Usuario } from '@shared/types'
import { createIpcMainMock } from '../helpers/mockIpc'

const ipc = createIpcMainMock()
const apiClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }

vi.mock('electron', () => ({ ipcMain: ipc.ipcMain }))
vi.mock('@main/api/client', async () => {
  const real = await vi.importActual<typeof import('@main/api/client')>('@main/api/client')
  return { ApiError: real.ApiError, apiClient }
})

const { registerUsuariosIpc } = await import('@main/ipc/usuarios.ipc')
const { ApiError } = await import('@main/api/client')

const usuario: Usuario = { id: 'u1', nombre: 'Ana', email: 'ana@x.com', rol: 'VENDEDOR' }

describe('usuarios.ipc', () => {
  beforeEach(() => {
    apiClient.get.mockReset()
    apiClient.post.mockReset()
    apiClient.patch.mockReset()
    apiClient.delete.mockReset()
    registerUsuariosIpc()
  })

  it('listar pide un límite alto y devuelve solo los datos (no la paginación)', async () => {
    apiClient.get.mockResolvedValue({ datos: [usuario], total: 1, page: 1, limit: 100 })

    const resultado = await ipc.invoke<Usuario[]>(IpcChannels.USUARIOS_LISTAR)

    expect(apiClient.get).toHaveBeenCalledWith('/usuarios?limit=100')
    expect(resultado).toEqual([usuario])
  })

  it('obtener devuelve el usuario si existe', async () => {
    apiClient.get.mockResolvedValue(usuario)
    const resultado = await ipc.invoke<Usuario | null>(IpcChannels.USUARIOS_OBTENER, 'u1')
    expect(apiClient.get).toHaveBeenCalledWith('/usuarios/u1')
    expect(resultado).toEqual(usuario)
  })

  it('obtener devuelve null si la API responde 404 (no propaga el error)', async () => {
    apiClient.get.mockRejectedValue(new ApiError('USUARIO_NO_ENCONTRADO', 'No existe', 404))
    const resultado = await ipc.invoke<Usuario | null>(IpcChannels.USUARIOS_OBTENER, 'no-existe')
    expect(resultado).toBeNull()
  })

  it('obtener propaga cualquier otro error (no lo confunde con "no encontrado")', async () => {
    apiClient.get.mockRejectedValue(new ApiError('ERROR_INTERNO', 'Falla de red', 500))
    await expect(ipc.invoke(IpcChannels.USUARIOS_OBTENER, 'u1')).rejects.toThrowError(/Falla de red/)
  })

  it('crear genera el id acá (la API lo requiere) y lo manda junto con los datos', async () => {
    apiClient.post.mockResolvedValue(usuario)

    await ipc.invoke(IpcChannels.USUARIOS_CREAR, {
      nombre: 'Ana',
      email: 'ana@x.com',
      rol: 'VENDEDOR',
      password: 'secreto1'
    })

    expect(apiClient.post).toHaveBeenCalledWith(
      '/usuarios',
      expect.objectContaining({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        nombre: 'Ana',
        email: 'ana@x.com',
        rol: 'VENDEDOR',
        password: 'secreto1'
      })
    )
  })

  it('actualizar manda los cambios por PATCH', async () => {
    apiClient.patch.mockResolvedValue({ ...usuario, nombre: 'Ana Actualizada' })

    await ipc.invoke(IpcChannels.USUARIOS_ACTUALIZAR, 'u1', { nombre: 'Ana Actualizada' })

    expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/u1', { nombre: 'Ana Actualizada' })
  })

  it('eliminar llama DELETE', async () => {
    apiClient.delete.mockResolvedValue(undefined)
    await ipc.invoke(IpcChannels.USUARIOS_ELIMINAR, 'u1')
    expect(apiClient.delete).toHaveBeenCalledWith('/usuarios/u1')
  })
})
