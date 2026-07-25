import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { Credenciales, SesionAuth, Usuario } from '@shared/types'
import { apiClient } from '../api/client'
import { limpiarSesion, setSesion } from '../api/session'

interface RespuestaLogin {
  accessToken: string
  refreshToken: string
  usuario: Usuario
}

export function registerAuthIpc(): void {
  ipcMain.handle(
    IpcChannels.AUTH_LOGIN,
    async (_event, credenciales: Credenciales): Promise<SesionAuth> => {
      const { accessToken, refreshToken, usuario } = await apiClient.post<RespuestaLogin>(
        '/auth/login',
        credenciales
      )

      setSesion({ usuario, accessToken, refreshToken })

      return { usuario }
    }
  )

  ipcMain.handle(IpcChannels.AUTH_LOGOUT, async (): Promise<void> => {
    limpiarSesion()
  })
}
