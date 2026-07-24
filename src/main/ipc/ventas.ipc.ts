import { randomUUID } from 'crypto'
import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { ItemVenta, Producto, Venta } from '@shared/types'
import { readCollection, writeCollection } from '../store/localStore'
import { PRODUCTOS_COLLECTION, registrarMovimiento } from '../inventario/stock'
import { encolarCambio } from '../sync/outbox'

const VENTAS_COLLECTION = 'ventas'

type VentaNueva = Omit<Venta, 'id' | 'creadoEn' | 'total'>

function calcularTotal(items: ItemVenta[]): number {
  return items.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0)
}

function validarStockDisponible(items: ItemVenta[]): void {
  const productos = readCollection<Producto>(PRODUCTOS_COLLECTION)

  for (const item of items) {
    const producto = productos.find((p) => p.id === item.productoId)

    if (!producto) {
      throw new Error(`Producto ${item.productoId} no encontrado`)
    }
    if (producto.stock < item.cantidad) {
      throw new Error(
        `Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock})`
      )
    }
    // El precio de venta se puede editar por ítem (para aplicar descuentos), pero no puede ser negativo.
    if (item.precioUnitario < 0) {
      throw new Error(`El precio de "${producto.nombre}" no puede ser negativo`)
    }
  }
}

export function registerVentasIpc(): void {
  ipcMain.handle(IpcChannels.VENTAS_LISTAR, async (): Promise<Venta[]> => {
    return readCollection<Venta>(VENTAS_COLLECTION)
  })

  ipcMain.handle(IpcChannels.VENTAS_CREAR, async (_event, datos: VentaNueva): Promise<Venta> => {
    if (datos.items.length === 0) {
      throw new Error('La venta debe tener al menos un producto')
    }

    validarStockDisponible(datos.items)

    const venta: Venta = {
      ...datos,
      id: randomUUID(),
      total: calcularTotal(datos.items),
      creadoEn: new Date().toISOString()
    }

    const ventas = readCollection<Venta>(VENTAS_COLLECTION)
    writeCollection(VENTAS_COLLECTION, [...ventas, venta])
    encolarCambio('ventas', 'CREAR', venta.id, venta)

    for (const item of venta.items) {
      registrarMovimiento({
        productoId: item.productoId,
        tipo: 'SALIDA',
        cantidad: item.cantidad,
        motivo: `Venta ${venta.id}`,
        usuarioId: venta.usuarioId
      })
    }

    return venta
  })
}
