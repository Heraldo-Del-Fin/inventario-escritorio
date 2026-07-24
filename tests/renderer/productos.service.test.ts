import { beforeEach, describe, expect, it } from 'vitest'
import { installMockWindowApi } from '../helpers/mockWindowApi'
import { productosService } from '@/services/productos.service'
import type { Producto } from '@shared/types'

const producto: Producto = {
  id: 'p1',
  sku: 'SKU-1',
  nombre: 'Tornillo',
  precio: 10,
  stock: 5,
  stockMinimo: 1,
  creadoEn: '2026-01-01T00:00:00.000Z',
  actualizadoEn: '2026-01-01T00:00:00.000Z'
}

describe('productos.service', () => {
  let api: ReturnType<typeof installMockWindowApi>

  beforeEach(() => {
    api = installMockWindowApi()
  })

  it('listar delega en window.api.productos.listar', async () => {
    api.productos.listar.mockResolvedValue([producto])
    await expect(productosService.listar()).resolves.toEqual([producto])
    expect(api.productos.listar).toHaveBeenCalledTimes(1)
  })

  it('obtener devuelve el producto cuando existe', async () => {
    api.productos.obtener.mockResolvedValue(producto)
    await expect(productosService.obtener('p1')).resolves.toEqual(producto)
    expect(api.productos.obtener).toHaveBeenCalledWith('p1')
  })

  it('obtener lanza un error si window.api devuelve null', async () => {
    api.productos.obtener.mockResolvedValue(null)
    await expect(productosService.obtener('no-existe')).rejects.toThrowError(/no encontrado/)
  })

  it('crear delega los datos tal cual en window.api.productos.crear', async () => {
    api.productos.crear.mockResolvedValue(producto)
    const datos = {
      sku: 'SKU-1',
      nombre: 'Tornillo',
      precio: 10,
      stock: 5,
      stockMinimo: 1
    }
    await productosService.crear(datos)
    expect(api.productos.crear).toHaveBeenCalledWith(datos)
  })

  it('eliminar delega en window.api.productos.eliminar', async () => {
    await productosService.eliminar('p1')
    expect(api.productos.eliminar).toHaveBeenCalledWith('p1')
  })
})
