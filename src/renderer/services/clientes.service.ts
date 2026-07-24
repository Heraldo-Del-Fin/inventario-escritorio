import type { Cliente } from '@shared/types'

export const clientesService = {
  listar: async (): Promise<Cliente[]> => {
    return window.api.clientes.listar()
  },

  obtener: async (id: string): Promise<Cliente> => {
    const cliente = await window.api.clientes.obtener(id)
    if (!cliente) throw new Error(`Cliente ${id} no encontrado`)
    return cliente
  },

  crear: async (cliente: Omit<Cliente, 'id'>): Promise<Cliente> => {
    return window.api.clientes.crear(cliente)
  },

  actualizar: async (id: string, cambios: Partial<Cliente>): Promise<Cliente> => {
    return window.api.clientes.actualizar(id, cambios)
  },

  eliminar: async (id: string): Promise<void> => {
    return window.api.clientes.eliminar(id)
  }
}
