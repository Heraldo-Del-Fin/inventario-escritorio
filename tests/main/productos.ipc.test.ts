import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/ipc-channels'
import type { Producto } from '@shared/types'
import type { CambioPendiente } from '@shared/types'
import { createIpcMainMock } from '../helpers/mockIpc'
import { createLocalStoreMock } from '../helpers/mockLocalStore'

const ipc = createIpcMainMock()
const store = createLocalStoreMock()

vi.mock('electron', () => ({ ipcMain: ipc.ipcMain }))
vi.mock('@main/store/localStore', () => ({
  readCollection: store.readCollection,
  writeCollection: store.writeCollection
}))

const { registerProductosIpc } = await import('@main/ipc/productos.ipc')
registerProductosIpc()

function cambiosEncolados(): CambioPendiente[] {
  return (store.data.get('cambios_pendientes') as CambioPendiente[]) ?? []
}

function nuevoProducto(overrides: Partial<Producto> = {}) {
  return {
    sku: 'SKU-1',
    nombre: 'Tornillo',
    precio: 10,
    stock: 5,
    stockMinimo: 1,
    ...overrides
  }
}

describe('productos.ipc', () => {
  beforeEach(() => {
    store.reset()
  })

  it('lista vacío por defecto', async () => {
    expect(await ipc.invoke(IpcChannels.PRODUCTOS_LISTAR)).toEqual([])
  })

  it('crea un producto con id y timestamps generados', async () => {
    const producto = await ipc.invoke<Producto>(IpcChannels.PRODUCTOS_CREAR, nuevoProducto())
    expect(producto.id).toBeTruthy()
    expect(producto.creadoEn).toBeTruthy()
    expect(producto.actualizadoEn).toBeTruthy()
    expect(await ipc.invoke(IpcChannels.PRODUCTOS_LISTAR)).toHaveLength(1)
  })

  it('rechaza crear sin SKU', async () => {
    await expect(
      ipc.invoke(IpcChannels.PRODUCTOS_CREAR, nuevoProducto({ sku: '  ' }))
    ).rejects.toThrowError(/SKU es obligatorio/)
  })

  it('rechaza un SKU duplicado (case-insensitive)', async () => {
    await ipc.invoke(IpcChannels.PRODUCTOS_CREAR, nuevoProducto({ sku: 'ABC' }))
    await expect(
      ipc.invoke(IpcChannels.PRODUCTOS_CREAR, nuevoProducto({ sku: 'abc' }))
    ).rejects.toThrowError(/Ya existe un producto/)
  })

  it('rechaza precio, stock o stock mínimo negativos', async () => {
    await expect(
      ipc.invoke(IpcChannels.PRODUCTOS_CREAR, nuevoProducto({ precio: -1 }))
    ).rejects.toThrowError(/precio no puede ser negativo/)
    await expect(
      ipc.invoke(IpcChannels.PRODUCTOS_CREAR, nuevoProducto({ stock: -1 }))
    ).rejects.toThrowError(/stock no puede ser negativo/)
    await expect(
      ipc.invoke(IpcChannels.PRODUCTOS_CREAR, nuevoProducto({ stockMinimo: -1 }))
    ).rejects.toThrowError(/stock mínimo no puede ser negativo/)
  })

  it('acepta un producto con imagen en un formato válido', async () => {
    const producto = await ipc.invoke<Producto>(
      IpcChannels.PRODUCTOS_CREAR,
      nuevoProducto({ imagenUrl: 'data:image/png;base64,aGVsbG8=' })
    )
    expect(producto.imagenUrl).toBe('data:image/png;base64,aGVsbG8=')
  })

  it('rechaza una imagen que no sea un data URL de un formato soportado', async () => {
    await expect(
      ipc.invoke(
        IpcChannels.PRODUCTOS_CREAR,
        nuevoProducto({ imagenUrl: 'data:application/pdf;base64,aGVsbG8=' })
      )
    ).rejects.toThrowError(/PNG, JPG, WEBP o GIF/)
  })

  it('rechaza una imagen que supere el tamaño máximo', async () => {
    const imagenGigante = 'data:image/png;base64,' + 'A'.repeat(3_000_000)
    await expect(
      ipc.invoke(IpcChannels.PRODUCTOS_CREAR, nuevoProducto({ imagenUrl: imagenGigante }))
    ).rejects.toThrowError(/no puede pesar más de 2MB/)
  })

  it('obtener devuelve null si no existe', async () => {
    expect(await ipc.invoke(IpcChannels.PRODUCTOS_OBTENER, 'no-existe')).toBeNull()
  })

  it('actualizar lanza si el producto no existe', async () => {
    await expect(
      ipc.invoke(IpcChannels.PRODUCTOS_ACTUALIZAR, 'no-existe', { nombre: 'X' })
    ).rejects.toThrowError(/no encontrado/)
  })

  it('actualizar permite mantener el mismo SKU sin chocar consigo mismo', async () => {
    const producto = await ipc.invoke<Producto>(IpcChannels.PRODUCTOS_CREAR, nuevoProducto())
    await expect(
      ipc.invoke(IpcChannels.PRODUCTOS_ACTUALIZAR, producto.id, { sku: producto.sku })
    ).resolves.toBeTruthy()
  })

  it('actualizar rechaza cambiar el SKU a uno usado por otro producto', async () => {
    await ipc.invoke(IpcChannels.PRODUCTOS_CREAR, nuevoProducto({ sku: 'AAA' }))
    const b = await ipc.invoke<Producto>(IpcChannels.PRODUCTOS_CREAR, nuevoProducto({ sku: 'BBB' }))
    await expect(
      ipc.invoke(IpcChannels.PRODUCTOS_ACTUALIZAR, b.id, { sku: 'AAA' })
    ).rejects.toThrowError(/Ya existe un producto/)
  })

  it('eliminar es soft-delete: desaparece de listar pero sigue existiendo (obtener)', async () => {
    const producto = await ipc.invoke<Producto>(IpcChannels.PRODUCTOS_CREAR, nuevoProducto())
    await ipc.invoke(IpcChannels.PRODUCTOS_ELIMINAR, producto.id)

    expect(await ipc.invoke(IpcChannels.PRODUCTOS_LISTAR)).toEqual([])

    const obtenido = await ipc.invoke<Producto | null>(IpcChannels.PRODUCTOS_OBTENER, producto.id)
    expect(obtenido?.activo).toBe(false)
    expect(obtenido?.id).toBe(producto.id)
  })

  it('eliminar un producto inexistente lanza error', async () => {
    await expect(ipc.invoke(IpcChannels.PRODUCTOS_ELIMINAR, 'no-existe')).rejects.toThrow(
      'no encontrado'
    )
  })

  it('crear deja el producto activo por defecto', async () => {
    const producto = await ipc.invoke<Producto>(IpcChannels.PRODUCTOS_CREAR, nuevoProducto())
    expect(producto.activo).toBe(true)
  })

  it('crear, actualizar y eliminar encolan un cambio pendiente de sincronización', async () => {
    const producto = await ipc.invoke<Producto>(IpcChannels.PRODUCTOS_CREAR, nuevoProducto())
    await ipc.invoke(IpcChannels.PRODUCTOS_ACTUALIZAR, producto.id, { nombre: 'Tuerca' })
    await ipc.invoke(IpcChannels.PRODUCTOS_ELIMINAR, producto.id)

    const operaciones = cambiosEncolados().map((c) => c.operacion)
    expect(operaciones).toEqual(['CREAR', 'ACTUALIZAR', 'ELIMINAR'])
    expect(cambiosEncolados().every((c) => c.estado === 'PENDIENTE')).toBe(true)
  })
})
