import { randomUUID } from 'crypto'
import type { MovimientoInventario, Producto } from '@shared/types'
import { readCollection, writeCollection } from '../store/localStore'
import { encolarCambio } from '../sync/outbox'

export const MOVIMIENTOS_COLLECTION = 'movimientos'
export const PRODUCTOS_COLLECTION = 'productos'

export type MovimientoNuevo = Omit<MovimientoInventario, 'id' | 'creadoEn'>

function aplicarMovimientoAlStock(
  productos: Producto[],
  movimiento: MovimientoInventario
): Producto[] {
  return productos.map((producto) => {
    if (producto.id !== movimiento.productoId) return producto

    const delta = movimiento.tipo === 'SALIDA' ? -movimiento.cantidad : movimiento.cantidad
    const stock = movimiento.tipo === 'AJUSTE' ? movimiento.cantidad : producto.stock + delta

    return { ...producto, stock, actualizadoEn: new Date().toISOString() }
  })
}

function validarMovimiento(datos: MovimientoNuevo, producto: Producto): void {
  if (datos.tipo === 'AJUSTE') {
    if (datos.cantidad < 0) {
      throw new Error('El stock no puede ser negativo')
    }
    return
  }

  if (datos.cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor a 0')
  }

  if (datos.tipo === 'SALIDA' && producto.stock < datos.cantidad) {
    throw new Error(`Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock})`)
  }
}

export function registrarMovimiento(datos: MovimientoNuevo): MovimientoInventario {
  const productos = readCollection<Producto>(PRODUCTOS_COLLECTION)
  const producto = productos.find((p) => p.id === datos.productoId)

  if (!producto) {
    throw new Error(`Producto ${datos.productoId} no encontrado`)
  }

  validarMovimiento(datos, producto)

  const movimiento: MovimientoInventario = {
    ...datos,
    id: randomUUID(),
    creadoEn: new Date().toISOString()
  }

  const movimientos = readCollection<MovimientoInventario>(MOVIMIENTOS_COLLECTION)
  writeCollection(MOVIMIENTOS_COLLECTION, [...movimientos, movimiento])
  encolarCambio('movimientos', 'CREAR', movimiento.id, movimiento)

  const productosActualizados = aplicarMovimientoAlStock(productos, movimiento)
  writeCollection(PRODUCTOS_COLLECTION, productosActualizados)

  const productoActualizado = productosActualizados.find((p) => p.id === movimiento.productoId)
  if (productoActualizado) {
    encolarCambio('productos', 'ACTUALIZAR', productoActualizado.id, productoActualizado)
  }

  return movimiento
}
