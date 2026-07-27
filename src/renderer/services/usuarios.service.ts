import type { Usuario } from '@shared/types'

interface UsuarioNuevo {
  nombre: string
  email: string
  rol: Usuario['rol']
  password: string
  sucursalId?: string
}

interface UsuarioCambios {
  nombre?: string
  email?: string
  rol?: Usuario['rol']
  password?: string
  sucursalId?: string
}

export const usuariosService = {
  listar: async (): Promise<Usuario[]> => {
    return window.api.usuarios.listar()
  },

  obtener: async (id: string): Promise<Usuario> => {
    const usuario = await window.api.usuarios.obtener(id)
    if (!usuario) throw new Error(`Usuario ${id} no encontrado`)
    return usuario
  },

  crear: async (datos: UsuarioNuevo): Promise<Usuario> => {
    return window.api.usuarios.crear(datos)
  },

  actualizar: async (id: string, cambios: UsuarioCambios): Promise<Usuario> => {
    return window.api.usuarios.actualizar(id, cambios)
  },

  eliminar: async (id: string): Promise<void> => {
    return window.api.usuarios.eliminar(id)
  }
}
