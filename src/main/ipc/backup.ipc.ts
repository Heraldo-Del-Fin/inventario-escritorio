import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import { crearRespaldo, listarRespaldos, restaurarRespaldo } from '../backup/backup'

export function registerBackupIpc(): void {
  ipcMain.handle(IpcChannels.BACKUP_CREAR, async (): Promise<string | null> => {
    return crearRespaldo()
  })

  ipcMain.handle(IpcChannels.BACKUP_LISTAR, async (): Promise<string[]> => {
    return listarRespaldos()
  })

  ipcMain.handle(IpcChannels.BACKUP_RESTAURAR, async (_event, nombre: string): Promise<void> => {
    restaurarRespaldo(nombre)
  })
}
