import { randomUUID } from 'crypto'
import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { Credenciales, SesionAuth } from '@shared/types'
import { verifyPassword } from '../auth/password'
import { buscarPorEmail, seedAdminPorDefecto, sinCredenciales } from '../auth/usuarios.repository'

export function registerAuthIpc(): void {
  seedAdminPorDefecto()

  ipcMain.handle(
    IpcChannels.AUTH_LOGIN,
    async (_event, credenciales: Credenciales): Promise<SesionAuth> => {
      const usuario = buscarPorEmail(credenciales.email)

      if (!usuario || !verifyPassword(credenciales.password, usuario.passwordHash)) {
        throw new Error('Correo o contraseña incorrectos')
      }

      return {
        usuario: sinCredenciales(usuario),
        token: randomUUID()
      }
    }
  )
}
