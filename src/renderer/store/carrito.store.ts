import { create } from 'zustand'
import type { ItemVenta } from '@shared/types'

interface CarritoState {
  items: ItemVenta[]
  agregarItem: (item: ItemVenta) => void
  quitarItem: (productoId: string) => void
  limpiar: () => void
  total: () => number
}

export const useCarritoStore = create<CarritoState>()((set, get) => ({
  items: [],

  agregarItem: (item) =>
    set((state) => {
      const existente = state.items.find((i) => i.productoId === item.productoId)
      if (existente) {
        return {
          items: state.items.map((i) =>
            i.productoId === item.productoId ? { ...i, cantidad: i.cantidad + item.cantidad } : i
          )
        }
      }
      return { items: [...state.items, item] }
    }),

  quitarItem: (productoId) =>
    set((state) => ({ items: state.items.filter((i) => i.productoId !== productoId) })),

  limpiar: () => set({ items: [] }),

  total: () => get().items.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0)
}))
