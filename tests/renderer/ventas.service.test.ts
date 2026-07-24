import { beforeEach, describe, expect, it } from 'vitest'
import { installMockWindowApi } from '../helpers/mockWindowApi'
import { ventasService } from '@/services/ventas.service'
import type { Venta } from '@shared/types'

const venta: Venta = {
  id: 'v1',
  items: [{ productoId: 'p1', cantidad: 1, precioUnitario: 10 }],
  total: 10,
  creadoEn: '2026-01-01T00:00:00.000Z'
}

describe('ventas.service', () => {
  let api: ReturnType<typeof installMockWindowApi>

  beforeEach(() => {
    api = installMockWindowApi()
  })

  it('listar delega en window.api.ventas.listar', async () => {
    api.ventas.listar.mockResolvedValue([venta])
    await expect(ventasService.listar()).resolves.toEqual([venta])
  })

  it('crear delega los datos tal cual (sin total, lo calcula el backend)', async () => {
    api.ventas.crear.mockResolvedValue(venta)
    const datos = { items: venta.items }
    await ventasService.crear(datos)
    expect(api.ventas.crear).toHaveBeenCalledWith(datos)
  })
})
