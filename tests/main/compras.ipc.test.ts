import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/ipc-channels'
import type { OrdenCompra, Producto } from '@shared/types'
import { createIpcMainMock } from '../helpers/mockIpc'
import { createLocalStoreMock } from '../helpers/mockLocalStore'

const ipc = createIpcMainMock()
const store = createLocalStoreMock()

vi.mock('electron', () => ({ ipcMain: ipc.ipcMain }))
vi.mock('@main/store/localStore', () => ({
  readCollection: store.readCollection,
  writeCollection: store.writeCollection
}))

const { registerComprasIpc } = await import('@main/ipc/compras.ipc')
const { PRODUCTOS_COLLECTION } = await import('@main/inventario/stock')
const { limpiarSesion, setSesion } = await import('@main/api/session')
registerComprasIpc()

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

describe('compras.ipc', () => {
  beforeEach(() => {
    store.reset()
    limpiarSesion()
  })

  it('lista vacío por defecto', async () => {
    expect(await ipc.invoke(IpcChannels.COMPRAS_LISTAR)).toEqual([])
  })

  it('rechaza una compra sin items', async () => {
    await expect(ipc.invoke(IpcChannels.COMPRAS_CREAR, { items: [] })).rejects.toThrowError(
      /al menos un producto/
    )
  })

  it('rechaza si el producto no existe', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [])
    await expect(
      ipc.invoke(IpcChannels.COMPRAS_CREAR, {
        items: [{ productoId: 'no-existe', cantidad: 1 }]
      })
    ).rejects.toThrowError(/no encontrado/)
  })

  it('rechaza una cantidad menor o igual a 0', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto()])
    await expect(
      ipc.invoke(IpcChannels.COMPRAS_CREAR, {
        items: [{ productoId: 'p1', cantidad: 0 }]
      })
    ).rejects.toThrowError(/mayor a 0/)
  })

  it('suma el stock del producto al confirmar la compra', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 5 })])

    const compra = await ipc.invoke<OrdenCompra>(IpcChannels.COMPRAS_CREAR, {
      items: [{ productoId: 'p1', cantidad: 4 }],
      proveedorId: 'prov1'
    })

    expect(compra.id).toBeTruthy()
    expect(compra.proveedorId).toBe('prov1')

    const productos = store.data.get(PRODUCTOS_COLLECTION) as Producto[]
    expect(productos[0].stock).toBe(9)
  })

  it('suma el stock de cada producto cuando la compra tiene varios items', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [
      producto({ id: 'p1', stock: 5 }),
      producto({ id: 'p2', sku: 'SKU-2', stock: 10 })
    ])

    await ipc.invoke(IpcChannels.COMPRAS_CREAR, {
      items: [
        { productoId: 'p1', cantidad: 4 },
        { productoId: 'p2', cantidad: 6 }
      ]
    })

    const productos = store.data.get(PRODUCTOS_COLLECTION) as Producto[]
    expect(productos.find((p) => p.id === 'p1')?.stock).toBe(9)
    expect(productos.find((p) => p.id === 'p2')?.stock).toBe(16)
  })

  it('registra los movimientos de inventario como ENTRADA con referencia a la compra', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 5 })])

    const compra = await ipc.invoke<OrdenCompra>(IpcChannels.COMPRAS_CREAR, {
      items: [{ productoId: 'p1', cantidad: 4 }]
    })

    const movimientos = store.data.get('movimientos') as {
      tipo: string
      cantidad: number
      motivo?: string
    }[]
    expect(movimientos).toHaveLength(1)
    expect(movimientos[0].tipo).toBe('ENTRADA')
    expect(movimientos[0].cantidad).toBe(4)
    expect(movimientos[0].motivo).toBe(`Compra ${compra.id}`)
  })

  it('estampa el usuarioId de la sesión activa en main en la compra y en los movimientos que genera', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [producto({ stock: 5 })])
    setSesion({
      usuario: { id: 'u1', nombre: 'Ana', email: 'a@x.com', rol: 'ALMACEN' },
      accessToken: 'a',
      refreshToken: 'r'
    })

    const compra = await ipc.invoke<OrdenCompra>(IpcChannels.COMPRAS_CREAR, {
      items: [{ productoId: 'p1', cantidad: 4 }]
    })
    expect(compra.usuarioId).toBe('u1')

    const movimientos = store.data.get('movimientos') as { usuarioId?: string }[]
    expect(movimientos[0].usuarioId).toBe('u1')
  })
})
