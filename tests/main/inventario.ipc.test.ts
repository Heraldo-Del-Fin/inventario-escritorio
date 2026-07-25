import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/ipc-channels'
import type { MovimientoInventario, Producto } from '@shared/types'
import { createIpcMainMock } from '../helpers/mockIpc'
import { createLocalStoreMock } from '../helpers/mockLocalStore'

const ipc = createIpcMainMock()
const store = createLocalStoreMock()

vi.mock('electron', () => ({ ipcMain: ipc.ipcMain }))
vi.mock('@main/store/localStore', () => ({
  readCollection: store.readCollection,
  writeCollection: store.writeCollection
}))

const { registerInventarioIpc } = await import('@main/ipc/inventario.ipc')
const { PRODUCTOS_COLLECTION } = await import('@main/inventario/stock')
const { limpiarSesion, setSesion } = await import('@main/api/session')
registerInventarioIpc()

describe('inventario.ipc', () => {
  beforeEach(() => {
    store.reset()
    limpiarSesion()
  })

  it('lista vacío por defecto', async () => {
    expect(await ipc.invoke(IpcChannels.INVENTARIO_LISTAR_MOVIMIENTOS)).toEqual([])
  })

  it('registrar un movimiento por IPC delega correctamente en la lógica real de stock', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [
      {
        id: 'p1',
        sku: 'SKU-1',
        nombre: 'Tornillo',
        precio: 10,
        stock: 5,
        stockMinimo: 1,
        creadoEn: '2026-01-01T00:00:00.000Z',
        actualizadoEn: '2026-01-01T00:00:00.000Z'
      } satisfies Producto
    ])

    const movimiento = await ipc.invoke<MovimientoInventario>(
      IpcChannels.INVENTARIO_REGISTRAR_MOVIMIENTO,
      { productoId: 'p1', tipo: 'ENTRADA', cantidad: 5 }
    )

    expect(movimiento.id).toBeTruthy()
    const movimientos = await ipc.invoke(IpcChannels.INVENTARIO_LISTAR_MOVIMIENTOS)
    expect(movimientos).toHaveLength(1)

    const productos = store.data.get(PRODUCTOS_COLLECTION) as Producto[]
    expect(productos[0].stock).toBe(10)
  })

  it('estampa el usuarioId de la sesión activa en main (no del payload del renderer)', async () => {
    store.writeCollection(PRODUCTOS_COLLECTION, [
      {
        id: 'p1',
        sku: 'SKU-1',
        nombre: 'Tornillo',
        precio: 10,
        stock: 5,
        stockMinimo: 1,
        creadoEn: '2026-01-01T00:00:00.000Z',
        actualizadoEn: '2026-01-01T00:00:00.000Z'
      } satisfies Producto
    ])
    setSesion({
      usuario: { id: 'u1', nombre: 'Ana', email: 'a@x.com', rol: 'ALMACEN' },
      accessToken: 'a',
      refreshToken: 'r'
    })

    const movimiento = await ipc.invoke<MovimientoInventario>(
      IpcChannels.INVENTARIO_REGISTRAR_MOVIMIENTO,
      { productoId: 'p1', tipo: 'ENTRADA', cantidad: 5 }
    )

    expect(movimiento.usuarioId).toBe('u1')
  })
})
