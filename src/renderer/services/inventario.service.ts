import type { MovimientoInventario } from '@shared/types'

export const inventarioService = {
  listarMovimientos: async (): Promise<MovimientoInventario[]> => {
    return window.api.inventario.listarMovimientos()
  },

  registrarMovimiento: async (
    movimiento: Omit<MovimientoInventario, 'id' | 'creadoEn'>
  ): Promise<MovimientoInventario> => {
    return window.api.inventario.registrarMovimiento(movimiento)
  }
}
