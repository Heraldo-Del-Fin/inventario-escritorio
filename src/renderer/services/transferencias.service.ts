import type { Transferencia } from '@shared/types'

interface TransferenciaNueva {
  productoId: string
  sucursalOrigenId: string
  sucursalDestinoId: string
  cantidad: number
  motivo?: string
}

export const transferenciasService = {
  listar: async (): Promise<Transferencia[]> => {
    return window.api.transferencias.listar()
  },

  crear: async (datos: TransferenciaNueva): Promise<Transferencia> => {
    return window.api.transferencias.crear(datos)
  }
}
