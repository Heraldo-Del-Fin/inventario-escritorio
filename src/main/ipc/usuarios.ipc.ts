import { randomUUID } from 'crypto'
import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { Usuario } from '@shared/types'
import { ApiError, apiClient } from '../api/client'

interface RespuestaPaginada<T> {
  datos: T[]
  total: number
  page: number
  limit: number
}

type UsuarioNuevo = { nombre: string; email: string; rol: Usuario['rol']; password: string }
type UsuarioCambios = { nombre?: string; email?: string; rol?: Usuario['rol']; password?: string }

export function registerUsuariosIpc(): void {
  ipcMain.handle(IpcChannels.USUARIOS_LISTAR, async (): Promise<Usuario[]> => {
    // Tope del paginado de la API (100) — si algún día hay más usuarios que eso hace
    // falta paginar de verdad en la UI, no solo acá.
    const respuesta = await apiClient.get<RespuestaPaginada<Usuario>>('/usuarios?limit=100')
    return respuesta.datos
  })

  ipcMain.handle(
    IpcChannels.USUARIOS_OBTENER,
    async (_event, id: string): Promise<Usuario | null> => {
      try {
        return await apiClient.get<Usuario>(`/usuarios/${id}`)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    }
  )

  ipcMain.handle(
    IpcChannels.USUARIOS_CREAR,
    async (_event, datos: UsuarioNuevo): Promise<Usuario> => {
      return apiClient.post<Usuario>('/usuarios', { id: randomUUID(), ...datos })
    }
  )

  ipcMain.handle(
    IpcChannels.USUARIOS_ACTUALIZAR,
    async (_event, id: string, cambios: UsuarioCambios): Promise<Usuario> => {
      return apiClient.patch<Usuario>(`/usuarios/${id}`, cambios)
    }
  )

  ipcMain.handle(IpcChannels.USUARIOS_ELIMINAR, async (_event, id: string): Promise<void> => {
    await apiClient.delete(`/usuarios/${id}`)
  })
}
