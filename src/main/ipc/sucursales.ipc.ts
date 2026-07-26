import { randomUUID } from 'crypto'
import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { Sucursal } from '@shared/types'
import { ApiError, apiClient } from '../api/client'

interface RespuestaPaginada<T> {
  datos: T[]
  total: number
  page: number
  limit: number
}

type SucursalNueva = { nombre: string }
type SucursalCambios = { nombre?: string }

// Proxy puro a la API, sin localStore ni outbox: gestionar sucursales es una operación
// administrativa online, mismo criterio que usuarios.ipc.ts.
export function registerSucursalesIpc(): void {
  ipcMain.handle(IpcChannels.SUCURSALES_LISTAR, async (): Promise<Sucursal[]> => {
    const respuesta = await apiClient.get<RespuestaPaginada<Sucursal>>('/sucursales?limit=100')
    return respuesta.datos
  })

  ipcMain.handle(
    IpcChannels.SUCURSALES_OBTENER,
    async (_event, id: string): Promise<Sucursal | null> => {
      try {
        return await apiClient.get<Sucursal>(`/sucursales/${id}`)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    }
  )

  ipcMain.handle(
    IpcChannels.SUCURSALES_CREAR,
    async (_event, datos: SucursalNueva): Promise<Sucursal> => {
      return apiClient.post<Sucursal>('/sucursales', { id: randomUUID(), ...datos })
    }
  )

  ipcMain.handle(
    IpcChannels.SUCURSALES_ACTUALIZAR,
    async (_event, id: string, cambios: SucursalCambios): Promise<Sucursal> => {
      return apiClient.patch<Sucursal>(`/sucursales/${id}`, cambios)
    }
  )

  ipcMain.handle(IpcChannels.SUCURSALES_ELIMINAR, async (_event, id: string): Promise<void> => {
    await apiClient.delete(`/sucursales/${id}`)
  })
}
