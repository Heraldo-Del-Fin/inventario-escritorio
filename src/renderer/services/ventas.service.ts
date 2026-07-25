import type { Venta } from '@shared/types'

export const ventasService = {
  listar: async (): Promise<Venta[]> => {
    return window.api.ventas.listar()
  },

  crear: async (venta: Omit<Venta, 'id' | 'creadoEn' | 'total' | 'usuarioId'>): Promise<Venta> => {
    return window.api.ventas.crear(venta)
  }
}
