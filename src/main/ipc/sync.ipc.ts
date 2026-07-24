import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { CambioPendiente, EstadoSincronizacion } from '@shared/types'
import { ejecutarSincronizacion, listarPendientes, obtenerEstadoSync } from '../sync/outbox'

export function registerSyncIpc(): void {
  ipcMain.handle(IpcChannels.SYNC_LISTAR_PENDIENTES, async (): Promise<CambioPendiente[]> => {
    return listarPendientes()
  })

  ipcMain.handle(IpcChannels.SYNC_ESTADO, async (): Promise<EstadoSincronizacion> => {
    return obtenerEstadoSync()
  })

  ipcMain.handle(
    IpcChannels.SYNC_EJECUTAR,
    async (): Promise<{ enviados: number; fallidos: number }> => {
      return ejecutarSincronizacion()
    }
  )
}
