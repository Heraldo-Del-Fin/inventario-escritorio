import { randomUUID } from 'crypto'
import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { ItemCompra, OrdenCompra, Producto } from '@shared/types'
import { getSesion } from '../api/session'
import { readCollection, writeCollection } from '../store/localStore'
import { PRODUCTOS_COLLECTION, registrarMovimiento } from '../inventario/stock'
import { encolarCambio } from '../sync/outbox'

const COMPRAS_COLLECTION = 'compras'

type CompraNueva = Omit<OrdenCompra, 'id' | 'creadoEn' | 'usuarioId'>

function validarItemsCompra(items: ItemCompra[]): void {
  const productos = readCollection<Producto>(PRODUCTOS_COLLECTION)

  for (const item of items) {
    const producto = productos.find((p) => p.id === item.productoId)

    if (!producto) {
      throw new Error(`Producto ${item.productoId} no encontrado`)
    }
    if (item.cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a 0')
    }
  }
}

export function registerComprasIpc(): void {
  ipcMain.handle(IpcChannels.COMPRAS_LISTAR, async (): Promise<OrdenCompra[]> => {
    return readCollection<OrdenCompra>(COMPRAS_COLLECTION)
  })

  ipcMain.handle(
    IpcChannels.COMPRAS_CREAR,
    async (_event, datos: CompraNueva): Promise<OrdenCompra> => {
      if (datos.items.length === 0) {
        throw new Error('La compra debe tener al menos un producto')
      }

      validarItemsCompra(datos.items)

      const usuarioId = getSesion()?.usuario.id
      const compra: OrdenCompra = {
        ...datos,
        id: randomUUID(),
        usuarioId,
        creadoEn: new Date().toISOString()
      }

      const compras = readCollection<OrdenCompra>(COMPRAS_COLLECTION)
      writeCollection(COMPRAS_COLLECTION, [...compras, compra])
      encolarCambio('compras', 'CREAR', compra.id, compra)

      for (const item of compra.items) {
        registrarMovimiento(
          {
            productoId: item.productoId,
            tipo: 'ENTRADA',
            cantidad: item.cantidad,
            motivo: `Compra ${compra.id}`
          },
          usuarioId
        )
      }

      return compra
    }
  )
}
