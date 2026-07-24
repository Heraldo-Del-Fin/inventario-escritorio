import type { Proveedor } from '@shared/types'

export const proveedoresService = {
  listar: async (): Promise<Proveedor[]> => {
    return window.api.proveedores.listar()
  },

  obtener: async (id: string): Promise<Proveedor> => {
    const proveedor = await window.api.proveedores.obtener(id)
    if (!proveedor) throw new Error(`Proveedor ${id} no encontrado`)
    return proveedor
  },

  crear: async (proveedor: Omit<Proveedor, 'id'>): Promise<Proveedor> => {
    return window.api.proveedores.crear(proveedor)
  },

  actualizar: async (id: string, cambios: Partial<Proveedor>): Promise<Proveedor> => {
    return window.api.proveedores.actualizar(id, cambios)
  },

  eliminar: async (id: string): Promise<void> => {
    return window.api.proveedores.eliminar(id)
  }
}
