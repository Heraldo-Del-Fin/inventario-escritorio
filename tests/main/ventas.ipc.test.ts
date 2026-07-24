import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/ipc-channels'
import type { Producto, Venta } from '@shared/types'
import { createIpcMainMock } from '../helpers/mockIpc'
import { createLocalStoreMock } from '../helpers/mockLocalStore'

const ipc = createIpcMainMock()
const store = createLocalStoreMock()

vi.mock('electron', () => ({ ipcMain: ipc.ipcMain }))
vi.mock('@main/store/localStore', () => ({
  readCollection: store.readCollection,
  writeCollection: store.writeCollection
}))

const { registerVentasIpc } = await import('@main/ipc/ventas.ipc')
const { PRODUCTOS_COLLECTION } = await import('@main/inventario/stock')
registerVentasIpc()

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

describe('ventas.ipc', () => {
  beforeEach(() => {
    store.reset()
  })

  it('lista vacío por defecto', async () => {
    expect(await ipc.invoke(IpcChannels.VENTAS_LISTAR)).toEqual([])
  })

  it('rechaza una venta sin items', async () => {
    await expect(ipc.invoke(IpcChannels.VENTAS_CREAR, { items: [] })).rejects.toThrowError(
      /al menos un producto/
    )
  })

  it('rechaza si el producto no existe', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [])
    await expect(
      ipc.invoke(IpcChannels.VENTAS_CREAR, {
        items: [{ productoId: 'no-existe', cantidad: 1, precioUnitario: 10 }]
      })
    ).rejects.toThrowError(/no encontrado/)
  })

  it('rechaza si no hay stock suficiente', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 1 })])
    await expect(
      ipc.invoke(IpcChannels.VENTAS_CREAR, {
        items: [{ productoId: 'p1', cantidad: 5, precioUnitario: 10 }]
      })
    ).rejects.toThrowError(/Stock insuficiente/)
  })

  it('rechaza un precio unitario negativo (permite descuentos, pero no precios negativos)', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 10 })])
    await expect(
      ipc.invoke(IpcChannels.VENTAS_CREAR, {
        items: [{ productoId: 'p1', cantidad: 1, precioUnitario: -5 }]
      })
    ).rejects.toThrowError(/no puede ser negativo/)
  })

  it('acepta un precio unitario por debajo del precio de lista (descuento)', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 10, precio: 20 })])

    const venta = await ipc.invoke<Venta>(IpcChannels.VENTAS_CREAR, {
      items: [{ productoId: 'p1', cantidad: 2, precioUnitario: 15 }]
    })

    expect(venta.total).toBe(30)
  })

  it('calcula el total en el servidor a partir de los items, ignora cualquier total del cliente', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 10 })])

    const venta = await ipc.invoke<Venta>(IpcChannels.VENTAS_CREAR, {
      items: [{ productoId: 'p1', cantidad: 3, precioUnitario: 10 }],
      total: 999999 // no debería tener ningún efecto: el tipo VentaNueva ni siquiera lo acepta en runtime real
    })

    expect(venta.total).toBe(30)
  })

  it('descuenta el stock del producto al confirmar la venta', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 10 })])

    await ipc.invoke(IpcChannels.VENTAS_CREAR, {
      items: [{ productoId: 'p1', cantidad: 4, precioUnitario: 10 }]
    })

    const productos = store.data.get(PRODUCTOS_COLLECTION) as Producto[]
    expect(productos[0].stock).toBe(6)
  })

  it('descuenta el stock de cada producto cuando la venta tiene varios items', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [
      producto({ id: 'p1', stock: 10 }),
      producto({ id: 'p2', sku: 'SKU-2', stock: 10 })
    ])

    await ipc.invoke(IpcChannels.VENTAS_CREAR, {
      items: [
        { productoId: 'p1', cantidad: 4, precioUnitario: 10 },
        { productoId: 'p2', cantidad: 1, precioUnitario: 5 }
      ]
    })

    const productos = store.data.get(PRODUCTOS_COLLECTION) as Producto[]
    expect(productos.find((p) => p.id === 'p1')?.stock).toBe(6)
    expect(productos.find((p) => p.id === 'p2')?.stock).toBe(9)
  })

  it('propaga el usuarioId de la venta a los movimientos que genera', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 10 })])

    const venta = await ipc.invoke<Venta>(IpcChannels.VENTAS_CREAR, {
      items: [{ productoId: 'p1', cantidad: 4, precioUnitario: 10 }],
      usuarioId: 'u1'
    })
    expect(venta.usuarioId).toBe('u1')

    const movimientos = store.data.get('movimientos') as { usuarioId?: string }[]
    expect(movimientos[0].usuarioId).toBe('u1')
  })
})
