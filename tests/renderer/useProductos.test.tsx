import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Producto } from '@shared/types'

vi.mock('@/services/productos.service', () => ({
  productosService: {
    listar: vi.fn()
  }
}))

const { productosService } = await import('@/services/productos.service')
const { useProductos } = await import('@/hooks/useProductos')

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

describe('useProductos', () => {
  beforeEach(() => {
    vi.mocked(productosService.listar).mockReset()
  })

  it('empieza cargando y termina con los productos listados', async () => {
    vi.mocked(productosService.listar).mockResolvedValue([producto])

    const { result } = renderHook(() => useProductos())

    expect(result.current.cargando).toBe(true)

    await waitFor(() => expect(result.current.cargando).toBe(false))

    expect(result.current.productos).toEqual([producto])
    expect(result.current.error).toBeNull()
  })

  it('si el servicio falla, expone un mensaje de error y deja de cargar', async () => {
    vi.mocked(productosService.listar).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useProductos())

    await waitFor(() => expect(result.current.cargando).toBe(false))

    expect(result.current.error).toMatch(/no se pudieron cargar/i)
    expect(result.current.productos).toEqual([])
  })

  it('recargar vuelve a pedir la lista al servicio', async () => {
    vi.mocked(productosService.listar).mockResolvedValue([producto])

    const { result } = renderHook(() => useProductos())
    await waitFor(() => expect(result.current.cargando).toBe(false))

    expect(productosService.listar).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.recargar()
    })

    await waitFor(() => expect(productosService.listar).toHaveBeenCalledTimes(2))
  })
})
