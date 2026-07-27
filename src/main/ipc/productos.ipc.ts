import { randomUUID } from 'crypto'
import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { Producto, StockPorSucursalItem } from '@shared/types'
import { readCollection, writeCollection } from '../store/localStore'
import { encolarCambio } from '../sync/outbox'
import { apiClient } from '../api/client'

const COLLECTION = 'productos'

// ~2MB de imagen original; en base64 el texto pesa ~4/3 de eso.
const MAX_IMAGEN_BASE64_LENGTH = 2_800_000
const FORMATO_IMAGEN_VALIDO = /^data:image\/(png|jpe?g|webp|gif);base64,/

type ProductoNuevo = Omit<Producto, 'id' | 'creadoEn' | 'actualizadoEn'>

function validarDatosProducto(
  datos: Partial<Producto>,
  productos: Producto[],
  idExcluir?: string
): void {
  if (datos.sku !== undefined) {
    const skuNormalizado = datos.sku.trim().toLowerCase()
    if (!skuNormalizado) {
      throw new Error('El SKU es obligatorio')
    }
    const duplicado = productos.some(
      (p) => p.id !== idExcluir && p.sku.toLowerCase() === skuNormalizado
    )
    if (duplicado) {
      throw new Error(`Ya existe un producto con el SKU ${datos.sku}`)
    }
  }

  if (datos.nombre !== undefined && !datos.nombre.trim()) {
    throw new Error('El nombre es obligatorio')
  }

  if (datos.precio !== undefined && datos.precio < 0) {
    throw new Error('El precio no puede ser negativo')
  }

  if (datos.stock !== undefined && datos.stock < 0) {
    throw new Error('El stock no puede ser negativo')
  }

  if (datos.stockMinimo !== undefined && datos.stockMinimo < 0) {
    throw new Error('El stock mínimo no puede ser negativo')
  }

  if (datos.imagenUrl !== undefined && datos.imagenUrl !== '') {
    if (!FORMATO_IMAGEN_VALIDO.test(datos.imagenUrl)) {
      throw new Error('La imagen debe ser PNG, JPG, WEBP o GIF')
    }
    if (datos.imagenUrl.length > MAX_IMAGEN_BASE64_LENGTH) {
      throw new Error('La imagen no puede pesar más de 2MB')
    }
  }
}

export function registerProductosIpc(): void {
  ipcMain.handle(IpcChannels.PRODUCTOS_LISTAR, async (): Promise<Producto[]> => {
    // Soft-delete: activo === false es lo único que se excluye (undefined = activo, registros viejos).
    return readCollection<Producto>(COLLECTION).filter((p) => p.activo !== false)
  })

  ipcMain.handle(
    IpcChannels.PRODUCTOS_OBTENER,
    async (_event, id: string): Promise<Producto | null> => {
      const productos = readCollection<Producto>(COLLECTION)
      return productos.find((p) => p.id === id) ?? null
    }
  )

  ipcMain.handle(
    IpcChannels.PRODUCTOS_CREAR,
    async (_event, datos: ProductoNuevo): Promise<Producto> => {
      const productos = readCollection<Producto>(COLLECTION)
      validarDatosProducto(datos, productos)

      const ahora = new Date().toISOString()
      const producto: Producto = {
        ...datos,
        id: randomUUID(),
        activo: true,
        creadoEn: ahora,
        actualizadoEn: ahora
      }

      writeCollection(COLLECTION, [...productos, producto])
      encolarCambio('productos', 'CREAR', producto.id, producto)
      return producto
    }
  )

  ipcMain.handle(
    IpcChannels.PRODUCTOS_ACTUALIZAR,
    async (_event, id: string, cambios: Partial<Producto>): Promise<Producto> => {
      const productos = readCollection<Producto>(COLLECTION)
      const indice = productos.findIndex((p) => p.id === id)

      if (indice === -1) {
        throw new Error(`Producto ${id} no encontrado`)
      }

      validarDatosProducto(cambios, productos, id)

      const actualizado: Producto = {
        ...productos[indice],
        ...cambios,
        id,
        actualizadoEn: new Date().toISOString()
      }

      productos[indice] = actualizado
      writeCollection(COLLECTION, productos)
      encolarCambio('productos', 'ACTUALIZAR', actualizado.id, actualizado)
      return actualizado
    }
  )

  // Soft-delete: nunca borra la fila (evita que ventas/movimientos que ya referencian este
  // producto se queden con un productoId que no resuelve a nada — ver ESQUEMA.md §7).
  ipcMain.handle(IpcChannels.PRODUCTOS_ELIMINAR, async (_event, id: string): Promise<void> => {
    const productos = readCollection<Producto>(COLLECTION)
    const indice = productos.findIndex((p) => p.id === id)

    if (indice === -1) {
      throw new Error(`Producto ${id} no encontrado`)
    }

    const desactivado: Producto = {
      ...productos[indice],
      activo: false,
      actualizadoEn: new Date().toISOString()
    }
    productos[indice] = desactivado
    writeCollection(COLLECTION, productos)
    // Se sigue encolando como ELIMINAR (no ACTUALIZAR): en la futura API, DELETE /productos/:id
    // ya hace exactamente este mismo soft-delete server-side — el mapeo operación->verbo HTTP
    // del outbox (ver migracion-api-compatibilidad.md §8) sigue siendo 1:1 así.
    encolarCambio('productos', 'ELIMINAR', id, null)
  })

  // A diferencia del resto de este archivo (100% local, JSON + outbox), este handler habla
  // directo con la API: es la única fuente que conoce el stock en las demás sucursales, algo
  // que el JSON local de este dispositivo (siempre el de "su" propia sucursal) no puede resolver.
  ipcMain.handle(
    IpcChannels.PRODUCTOS_OBTENER_STOCK_POR_SUCURSAL,
    async (_event, id: string): Promise<StockPorSucursalItem[]> => {
      return apiClient.get<StockPorSucursalItem[]>(`/productos/${id}/stock`)
    }
  )
}
