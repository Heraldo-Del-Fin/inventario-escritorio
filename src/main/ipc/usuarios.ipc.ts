import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { Usuario } from '@shared/types'
import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
  obtenerUsuario,
  type UsuarioCambios,
  type UsuarioNuevo
} from '../auth/usuarios.repository'

export function registerUsuariosIpc(): void {
  ipcMain.handle(IpcChannels.USUARIOS_LISTAR, async (): Promise<Usuario[]> => {
    return listarUsuarios()
  })

  ipcMain.handle(
    IpcChannels.USUARIOS_OBTENER,
    async (_event, id: string): Promise<Usuario | null> => {
      return obtenerUsuario(id) ?? null
    }
  )

  ipcMain.handle(
    IpcChannels.USUARIOS_CREAR,
    async (_event, datos: UsuarioNuevo): Promise<Usuario> => {
      return crearUsuario(datos)
    }
  )

  ipcMain.handle(
    IpcChannels.USUARIOS_ACTUALIZAR,
    async (_event, id: string, cambios: UsuarioCambios): Promise<Usuario> => {
      return actualizarUsuario(id, cambios)
    }
  )

  ipcMain.handle(IpcChannels.USUARIOS_ELIMINAR, async (_event, id: string): Promise<void> => {
    eliminarUsuario(id)
  })
}
