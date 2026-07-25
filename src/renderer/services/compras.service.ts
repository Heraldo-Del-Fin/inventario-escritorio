import type { OrdenCompra } from '@shared/types'

export const comprasService = {
  listar: async (): Promise<OrdenCompra[]> => {
    return window.api.compras.listar()
  },

  crear: async (
    compra: Omit<OrdenCompra, 'id' | 'creadoEn' | 'usuarioId'>
  ): Promise<OrdenCompra> => {
    return window.api.compras.crear(compra)
  }
}
