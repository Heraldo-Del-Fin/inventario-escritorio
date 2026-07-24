import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'

export function registerImpresionIpc(): void {
  ipcMain.handle(
    IpcChannels.IMPRESION_IMPRIMIR_TICKET,
    async (_event, ventaId: string): Promise<boolean> => {
      // TODO: integrar con la impresora de tickets (ESC/POS, PDF, etc.)
      console.log(`Imprimiendo ticket de la venta ${ventaId}`)
      return true
    }
  )
}
