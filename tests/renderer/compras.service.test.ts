import { beforeEach, describe, expect, it } from 'vitest'
import { installMockWindowApi } from '../helpers/mockWindowApi'
import { comprasService } from '@/services/compras.service'
import type { OrdenCompra } from '@shared/types'

const compra: OrdenCompra = {
  id: 'c1',
  proveedorId: 'prov1',
  items: [{ productoId: 'p1', cantidad: 3 }],
  creadoEn: '2026-01-01T00:00:00.000Z'
}

describe('compras.service', () => {
  let api: ReturnType<typeof installMockWindowApi>

  beforeEach(() => {
    api = installMockWindowApi()
  })

  it('listar delega en window.api.compras.listar', async () => {
    api.compras.listar.mockResolvedValue([compra])
    await expect(comprasService.listar()).resolves.toEqual([compra])
  })

  it('crear delega los datos en window.api.compras.crear', async () => {
    api.compras.crear.mockResolvedValue(compra)
    const datos = { proveedorId: 'prov1', items: [{ productoId: 'p1', cantidad: 3 }] }
    await comprasService.crear(datos)
    expect(api.compras.crear).toHaveBeenCalledWith(datos)
  })
})
