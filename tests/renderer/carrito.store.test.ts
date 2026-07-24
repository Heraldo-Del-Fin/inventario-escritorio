import { beforeEach, describe, expect, it } from 'vitest'
import { useCarritoStore } from '@/store/carrito.store'

describe('carrito.store', () => {
  beforeEach(() => {
    useCarritoStore.setState({ items: [] })
  })

  it('empieza vacío', () => {
    expect(useCarritoStore.getState().items).toEqual([])
    expect(useCarritoStore.getState().total()).toBe(0)
  })

  it('agregarItem suma un item nuevo', () => {
    useCarritoStore.getState().agregarItem({ productoId: 'p1', cantidad: 2, precioUnitario: 10 })
    expect(useCarritoStore.getState().items).toEqual([
      { productoId: 'p1', cantidad: 2, precioUnitario: 10 }
    ])
  })

  it('agregarItem con el mismo producto acumula la cantidad en vez de duplicar la fila', () => {
    useCarritoStore.getState().agregarItem({ productoId: 'p1', cantidad: 2, precioUnitario: 10 })
    useCarritoStore.getState().agregarItem({ productoId: 'p1', cantidad: 3, precioUnitario: 10 })

    const items = useCarritoStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].cantidad).toBe(5)
  })

  it('quitarItem elimina solo ese producto', () => {
    useCarritoStore.getState().agregarItem({ productoId: 'p1', cantidad: 1, precioUnitario: 10 })
    useCarritoStore.getState().agregarItem({ productoId: 'p2', cantidad: 1, precioUnitario: 20 })

    useCarritoStore.getState().quitarItem('p1')

    expect(useCarritoStore.getState().items.map((i) => i.productoId)).toEqual(['p2'])
  })

  it('total suma cantidad * precioUnitario de todos los items', () => {
    useCarritoStore.getState().agregarItem({ productoId: 'p1', cantidad: 2, precioUnitario: 10 })
    useCarritoStore.getState().agregarItem({ productoId: 'p2', cantidad: 3, precioUnitario: 5 })

    expect(useCarritoStore.getState().total()).toBe(35)
  })

  it('limpiar vacía el carrito', () => {
    useCarritoStore.getState().agregarItem({ productoId: 'p1', cantidad: 1, precioUnitario: 10 })
    useCarritoStore.getState().limpiar()
    expect(useCarritoStore.getState().items).toEqual([])
  })
})
