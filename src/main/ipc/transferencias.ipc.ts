import { randomUUID } from 'crypto'
import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { Transferencia } from '@shared/types'
import { apiClient } from '../api/client'

interface RespuestaPaginada<T> {
  datos: T[]
  total: number
  page: number
  limit: number
}

type TransferenciaNueva = {
  productoId: string
  sucursalOrigenId: string
  sucursalDestinoId: string
  cantidad: number
  motivo?: string
}

export function registerTransferenciasIpc(): void {
  ipcMain.handle(IpcChannels.TRANSFERENCIAS_LISTAR, async (): Promise<Transferencia[]> => {
    const respuesta = await apiClient.get<RespuestaPaginada<Transferencia>>(
      '/transferencias?limit=100'
    )
    return respuesta.datos
  })

  ipcMain.handle(
    IpcChannels.TRANSFERENCIAS_CREAR,
    async (_event, datos: TransferenciaNueva): Promise<Transferencia> => {
      return apiClient.post<Transferencia>('/transferencias', {
        id: randomUUID(),
        ...datos,
        creadoEn: new Date().toISOString()
      })
    }
  )
}
