import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { MovimientoInventario } from '@shared/types'
import { getSesion } from '../api/session'
import { readCollection } from '../store/localStore'
import {
  MOVIMIENTOS_COLLECTION,
  registrarMovimiento,
  type MovimientoNuevo
} from '../inventario/stock'

export function registerInventarioIpc(): void {
  ipcMain.handle(
    IpcChannels.INVENTARIO_LISTAR_MOVIMIENTOS,
    async (): Promise<MovimientoInventario[]> => {
      return readCollection<MovimientoInventario>(MOVIMIENTOS_COLLECTION)
    }
  )

  ipcMain.handle(
    IpcChannels.INVENTARIO_REGISTRAR_MOVIMIENTO,
    async (_event, datos: MovimientoNuevo): Promise<MovimientoInventario> => {
      return registrarMovimiento(datos, getSesion()?.usuario.id)
    }
  )
}
