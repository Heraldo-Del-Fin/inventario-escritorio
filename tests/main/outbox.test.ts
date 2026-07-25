import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createLocalStoreMock } from '../helpers/mockLocalStore'

const store = createLocalStoreMock()
const apiClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }

vi.mock('@main/store/localStore', () => ({
  readCollection: store.readCollection,
  writeCollection: store.writeCollection
}))
vi.mock('@main/api/client', () => ({ apiClient }))

const { encolarCambio, listarPendientes, obtenerEstadoSync, ejecutarSincronizacion } =
  await import('@main/sync/outbox')
const { limpiarSesion, setSesion } = await import('@main/api/session')

const SESION = {
  usuario: { id: 'u1', nombre: 'Ana', email: 'a@x.com', rol: 'ADMIN' as const },
  accessToken: 'a',
  refreshToken: 'r'
}

describe('outbox', () => {
  beforeEach(() => {
    store.reset()
    limpiarSesion()
    apiClient.get.mockReset()
    apiClient.post.mockReset()
    apiClient.patch.mockReset()
    apiClient.delete.mockReset()
  })

  it('encola un cambio con estado PENDIENTE', () => {
    const cambio = encolarCambio('productos', 'CREAR', 'p1', { id: 'p1', nombre: 'Tornillo' })

    expect(cambio.estado).toBe('PENDIENTE')
    expect(cambio.intentos).toBe(0)
    expect(cambio.id).toBeTruthy()
    expect(cambio.creadoEn).toBeTruthy()
  })

  it('conserva el orden de encolado (para poder reproducir las operaciones en secuencia)', () => {
    encolarCambio('productos', 'CREAR', 'p1', { id: 'p1' })
    encolarCambio('productos', 'ACTUALIZAR', 'p1', { id: 'p1' })
    encolarCambio('ventas', 'CREAR', 'v1', { id: 'v1' })

    const pendientes = listarPendientes()
    expect(pendientes.map((c) => c.entidad)).toEqual(['productos', 'productos', 'ventas'])
  })

  it('sin sesión activa, falla sin llamar a la API y sin perder el cambio (queda en ERROR)', async () => {
    encolarCambio('productos', 'CREAR', 'p1', { id: 'p1' })

    const resultado = await ejecutarSincronizacion()

    expect(resultado).toEqual({ enviados: 0, fallidos: 1 })
    expect(apiClient.post).not.toHaveBeenCalled()
    expect(listarPendientes()[0].estado).toBe('ERROR')
    expect(listarPendientes()[0].ultimoError).toMatch(/sesión activa/)
  })

  it('obtenerEstadoSync cuenta pendientes, con error y sincronizados', async () => {
    setSesion(SESION)
    apiClient.post.mockResolvedValue({})
    encolarCambio('productos', 'CREAR', 'p1', { id: 'p1', nombre: 'A', sku: 'A', precio: 1, stock: 1, stockMinimo: 0, creadoEn: '2026-01-01T00:00:00.000Z' })
    encolarCambio('productos', 'CREAR', 'p2', { id: 'p2', nombre: 'B', sku: 'B', precio: 1, stock: 1, stockMinimo: 0, creadoEn: '2026-01-01T00:00:00.000Z' })

    expect(obtenerEstadoSync()).toEqual({ pendientes: 2, conError: 0, sincronizados: 0 })

    await ejecutarSincronizacion()

    expect(obtenerEstadoSync()).toEqual({ pendientes: 0, conError: 0, sincronizados: 2 })
  })

  it('no reintenta cambios que ya están SINCRONIZADO', async () => {
    setSesion(SESION)
    apiClient.post.mockRejectedValueOnce(new Error('caída de red')).mockResolvedValueOnce({})
    encolarCambio('productos', 'CREAR', 'p1', {
      id: 'p1',
      nombre: 'A',
      sku: 'A',
      precio: 1,
      stock: 1,
      stockMinimo: 0,
      creadoEn: '2026-01-01T00:00:00.000Z'
    })

    await ejecutarSincronizacion() // falla (mock rechaza la primera vez)
    expect(listarPendientes()[0].estado).toBe('ERROR')

    const resultado = await ejecutarSincronizacion() // reintenta, esta vez el mock resuelve

    expect(resultado).toEqual({ enviados: 1, fallidos: 0 })
    expect(listarPendientes()).toHaveLength(0)
  })

  describe('mapeo entidad/operación -> HTTP', () => {
    beforeEach(() => {
      setSesion(SESION)
      apiClient.post.mockResolvedValue({})
      apiClient.patch.mockResolvedValue({})
      apiClient.delete.mockResolvedValue(undefined)
    })

    it('CREAR productos: POST /productos, solo con los campos que la API acepta', async () => {
      encolarCambio('productos', 'CREAR', 'p1', {
        id: 'p1',
        sku: 'SKU-1',
        nombre: 'Tornillo',
        precio: 10,
        stock: 5,
        stockMinimo: 1,
        activo: true, // la API no lo acepta en el body: lo gestiona ella sola
        creadoEn: '2026-01-01T00:00:00.000Z',
        actualizadoEn: '2026-01-01T00:00:00.000Z' // tampoco esto
      })

      await ejecutarSincronizacion()

      expect(apiClient.post).toHaveBeenCalledWith('/productos', {
        id: 'p1',
        sku: 'SKU-1',
        nombre: 'Tornillo',
        precio: 10,
        stock: 5,
        stockMinimo: 1,
        creadoEn: '2026-01-01T00:00:00.000Z'
      })
    })

    it('ACTUALIZAR productos: PATCH /productos/:id sin id/stock/activo/actualizadoEn', async () => {
      encolarCambio('productos', 'ACTUALIZAR', 'p1', {
        id: 'p1',
        sku: 'SKU-1',
        nombre: 'Tornillo actualizado',
        precio: 12,
        stock: 5,
        stockMinimo: 1,
        activo: true,
        creadoEn: '2026-01-01T00:00:00.000Z',
        actualizadoEn: '2026-02-01T00:00:00.000Z'
      })

      await ejecutarSincronizacion()

      expect(apiClient.patch).toHaveBeenCalledWith('/productos/p1', {
        sku: 'SKU-1',
        nombre: 'Tornillo actualizado',
        precio: 12,
        stockMinimo: 1
      })
    })

    it('ELIMINAR productos: DELETE /productos/:id sin body', async () => {
      encolarCambio('productos', 'ELIMINAR', 'p1', null)

      await ejecutarSincronizacion()

      expect(apiClient.delete).toHaveBeenCalledWith('/productos/p1')
    })

    it('CREAR proveedores: POST /proveedores sin esGeneral', async () => {
      encolarCambio('proveedores', 'CREAR', 'prov1', {
        id: 'prov1',
        nombre: 'ACME',
        esGeneral: false
      })

      await ejecutarSincronizacion()

      expect(apiClient.post).toHaveBeenCalledWith('/proveedores', { id: 'prov1', nombre: 'ACME' })
    })

    it('CREAR ventas: POST /ventas sin total ni usuarioId (la API los recalcula/estampa)', async () => {
      encolarCambio('ventas', 'CREAR', 'v1', {
        id: 'v1',
        items: [{ productoId: 'p1', cantidad: 1, precioUnitario: 10 }],
        total: 10,
        usuarioId: 'u1',
        creadoEn: '2026-01-01T00:00:00.000Z'
      })

      await ejecutarSincronizacion()

      expect(apiClient.post).toHaveBeenCalledWith('/ventas', {
        id: 'v1',
        items: [{ productoId: 'p1', cantidad: 1, precioUnitario: 10 }],
        creadoEn: '2026-01-01T00:00:00.000Z'
      })
    })

    it('CREAR movimientos: POST /movimientos sin usuarioId', async () => {
      encolarCambio('movimientos', 'CREAR', 'm1', {
        id: 'm1',
        productoId: 'p1',
        tipo: 'ENTRADA',
        cantidad: 3,
        usuarioId: 'u1',
        creadoEn: '2026-01-01T00:00:00.000Z'
      })

      await ejecutarSincronizacion()

      expect(apiClient.post).toHaveBeenCalledWith('/movimientos', {
        id: 'm1',
        productoId: 'p1',
        tipo: 'ENTRADA',
        cantidad: 3,
        creadoEn: '2026-01-01T00:00:00.000Z'
      })
    })
  })

  it('un error de negocio de la API (ej. SKU duplicado) deja el cambio en ERROR con ese mensaje', async () => {
    setSesion(SESION)
    apiClient.post.mockRejectedValue(new Error('Ya existe un producto con el SKU SKU-1'))
    encolarCambio('productos', 'CREAR', 'p1', {
      id: 'p1',
      sku: 'SKU-1',
      nombre: 'A',
      precio: 1,
      stock: 1,
      stockMinimo: 0,
      creadoEn: '2026-01-01T00:00:00.000Z'
    })

    const resultado = await ejecutarSincronizacion()

    expect(resultado).toEqual({ enviados: 0, fallidos: 1 })
    expect(listarPendientes()[0].ultimoError).toBe('Ya existe un producto con el SKU SKU-1')
    expect(listarPendientes()[0].intentos).toBe(1)
  })
})
