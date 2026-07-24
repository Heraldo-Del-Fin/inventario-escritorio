import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Producto } from '@shared/types'
import { createLocalStoreMock } from '../helpers/mockLocalStore'

const store = createLocalStoreMock()

vi.mock('@main/store/localStore', () => ({
  readCollection: store.readCollection,
  writeCollection: store.writeCollection
}))

const { registrarMovimiento, PRODUCTOS_COLLECTION, MOVIMIENTOS_COLLECTION } =
  await import('@main/inventario/stock')

function producto(overrides: Partial<Producto> = {}): Producto {
  return {
    id: 'p1',
    sku: 'SKU-1',
    nombre: 'Tornillo',
    precio: 10,
    stock: 5,
    stockMinimo: 1,
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

describe('registrarMovimiento', () => {
  beforeEach(() => {
    store.reset()
  })

  it('rechaza un movimiento para un producto inexistente', () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [])
    expect(() =>
      registrarMovimiento({ productoId: 'no-existe', tipo: 'ENTRADA', cantidad: 1 })
    ).toThrowError(/no encontrado/)
  })

  it('ENTRADA suma al stock actual', () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 5 })])

    const movimiento = registrarMovimiento({ productoId: 'p1', tipo: 'ENTRADA', cantidad: 3 })

    expect(movimiento.id).toBeTruthy()
    expect(movimiento.creadoEn).toBeTruthy()
    const productos = store.data.get(PRODUCTOS_COLLECTION) as Producto[]
    expect(productos[0].stock).toBe(8)
  })

  it('SALIDA resta del stock actual', () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 5 })])

    registrarMovimiento({ productoId: 'p1', tipo: 'SALIDA', cantidad: 2 })

    const productos = store.data.get(PRODUCTOS_COLLECTION) as Producto[]
    expect(productos[0].stock).toBe(3)
  })

  it('rechaza una SALIDA que deje el stock negativo', () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 5 })])

    expect(() =>
      registrarMovimiento({ productoId: 'p1', tipo: 'SALIDA', cantidad: 999 })
    ).toThrowError(/Stock insuficiente/)
  })

  it('rechaza ENTRADA/SALIDA con cantidad 0 o negativa', () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 5 })])

    expect(() =>
      registrarMovimiento({ productoId: 'p1', tipo: 'ENTRADA', cantidad: 0 })
    ).toThrowError(/mayor a 0/)
    expect(() =>
      registrarMovimiento({ productoId: 'p1', tipo: 'SALIDA', cantidad: -1 })
    ).toThrowError(/mayor a 0/)
  })

  it('AJUSTE fija el stock exacto, incluso en 0', () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 5 })])

    registrarMovimiento({ productoId: 'p1', tipo: 'AJUSTE', cantidad: 0 })

    const productos = store.data.get(PRODUCTOS_COLLECTION) as Producto[]
    expect(productos[0].stock).toBe(0)
  })

  it('rechaza un AJUSTE con cantidad negativa', () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 5 })])

    expect(() =>
      registrarMovimiento({ productoId: 'p1', tipo: 'AJUSTE', cantidad: -1 })
    ).toThrowError(/no puede ser negativo/)
  })

  it('acumula los movimientos en vez de pisarlos', () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 10 })])

    registrarMovimiento({ productoId: 'p1', tipo: 'SALIDA', cantidad: 1 })
    registrarMovimiento({ productoId: 'p1', tipo: 'SALIDA', cantidad: 1 })

    const movimientos = store.data.get(MOVIMIENTOS_COLLECTION) as unknown[]
    expect(movimientos).toHaveLength(2)
  })
})
