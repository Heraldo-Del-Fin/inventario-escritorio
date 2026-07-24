import type { CambioPendiente, EstadoSincronizacion } from '@shared/types'

export const syncService = {
  listarPendientes: async (): Promise<CambioPendiente[]> => {
    return window.api.sync.listarPendientes()
  },

  estado: async (): Promise<EstadoSincronizacion> => {
    return window.api.sync.estado()
  },

  ejecutar: async (): Promise<{ enviados: number; fallidos: number }> => {
    return window.api.sync.ejecutar()
  }
}
