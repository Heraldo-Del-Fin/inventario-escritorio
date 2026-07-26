import type { Sucursal } from '@shared/types'

interface SucursalNueva {
  nombre: string
}

interface SucursalCambios {
  nombre?: string
}

export const sucursalesService = {
  listar: async (): Promise<Sucursal[]> => {
    return window.api.sucursales.listar()
  },

  obtener: async (id: string): Promise<Sucursal> => {
    const sucursal = await window.api.sucursales.obtener(id)
    if (!sucursal) throw new Error(`Sucursal ${id} no encontrada`)
    return sucursal
  },

  crear: async (datos: SucursalNueva): Promise<Sucursal> => {
    return window.api.sucursales.crear(datos)
  },

  actualizar: async (id: string, cambios: SucursalCambios): Promise<Sucursal> => {
    return window.api.sucursales.actualizar(id, cambios)
  },

  eliminar: async (id: string): Promise<void> => {
    return window.api.sucursales.eliminar(id)
  }
}
