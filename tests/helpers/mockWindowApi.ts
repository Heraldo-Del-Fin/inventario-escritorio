import { vi } from 'vitest'

export function installMockWindowApi() {
  const api = {
    auth: {
      login: vi.fn()
    },
    usuarios: {
      listar: vi.fn(),
      obtener: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn()
    },
    productos: {
      listar: vi.fn(),
      obtener: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn()
    },
    inventario: {
      listarMovimientos: vi.fn(),
      registrarMovimiento: vi.fn()
    },
    ventas: {
      listar: vi.fn(),
      crear: vi.fn()
    },
    compras: {
      listar: vi.fn(),
      crear: vi.fn()
    },
    proveedores: {
      listar: vi.fn(),
      obtener: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn()
    },
    clientes: {
      listar: vi.fn(),
      obtener: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn()
    },
    impresion: {
      imprimirTicket: vi.fn()
    },
    sync: {
      listarPendientes: vi.fn(),
      estado: vi.fn(),
      ejecutar: vi.fn()
    },
    backup: {
      crear: vi.fn(),
      listar: vi.fn(),
      restaurar: vi.fn()
    }
  }

  window.api = api as unknown as Window['api']

  return api
}
