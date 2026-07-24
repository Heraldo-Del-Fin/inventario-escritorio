import { beforeEach, describe, expect, it } from 'vitest'
import { installMockWindowApi } from '../helpers/mockWindowApi'
import { inventarioService } from '@/services/inventario.service'
import type { MovimientoInventario } from '@shared/types'

const movimiento: MovimientoInventario = {
  id: 'm1',
  productoId: 'p1',
  tipo: 'ENTRADA',
  cantidad: 5,
  creadoEn: '2026-01-01T00:00:00.000Z'
}

describe('inventario.service', () => {
  let api: ReturnType<typeof installMockWindowApi>

  beforeEach(() => {
    api = installMockWindowApi()
  })

  it('listarMovimientos delega en window.api.inventario.listarMovimientos', async () => {
    api.inventario.listarMovimientos.mockResolvedValue([movimiento])
    await expect(inventarioService.listarMovimientos()).resolves.toEqual([movimiento])
  })

  it('registrarMovimiento delega los datos tal cual', async () => {
    api.inventario.registrarMovimiento.mockResolvedValue(movimiento)
    const datos = { productoId: 'p1', tipo: 'ENTRADA' as const, cantidad: 5 }
    await inventarioService.registrarMovimiento(datos)
    expect(api.inventario.registrarMovimiento).toHaveBeenCalledWith(datos)
  })
})
