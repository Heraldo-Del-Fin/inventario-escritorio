import type { InventarioPorSucursalItem, Producto, StockPorSucursalItem } from '@shared/types'

export const productosService = {
  listar: async (): Promise<Producto[]> => {
    return window.api.productos.listar()
  },

  obtener: async (id: string): Promise<Producto> => {
    const producto = await window.api.productos.obtener(id)
    if (!producto) throw new Error(`Producto ${id} no encontrado`)
    return producto
  },

  crear: async (
    producto: Omit<Producto, 'id' | 'creadoEn' | 'actualizadoEn'>
  ): Promise<Producto> => {
    return window.api.productos.crear(producto)
  },

  actualizar: async (id: string, producto: Partial<Producto>): Promise<Producto> => {
    return window.api.productos.actualizar(id, producto)
  },

  eliminar: async (id: string): Promise<void> => {
    return window.api.productos.eliminar(id)
  },

  obtenerStockPorSucursal: async (id: string): Promise<StockPorSucursalItem[]> => {
    return window.api.productos.obtenerStockPorSucursal(id)
  },

  listarInventarioPorSucursal: async (): Promise<InventarioPorSucursalItem[]> => {
    return window.api.productos.listarInventarioPorSucursal()
  }
}
