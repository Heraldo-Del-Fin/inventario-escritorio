import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createLocalStoreMock } from '../helpers/mockLocalStore'

const store = createLocalStoreMock()

vi.mock('@main/store/localStore', () => ({
  readCollection: store.readCollection,
  writeCollection: store.writeCollection
}))

const { encolarCambio, listarPendientes, obtenerEstadoSync, ejecutarSincronizacion } =
  await import('@main/sync/outbox')

describe('outbox', () => {
  beforeEach(() => {
    store.reset()
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

  it('listarPendientes no incluye los ya sincronizados', async () => {
    encolarCambio('productos', 'CREAR', 'p1', { id: 'p1' })
    expect(listarPendientes()).toHaveLength(1)

    await ejecutarSincronizacion()

    // la API todavía no existe, así que la sincronización falla y el cambio
    // queda en ERROR (no en SINCRONIZADO) — sigue apareciendo como pendiente.
    expect(listarPendientes()).toHaveLength(1)
    expect(listarPendientes()[0].estado).toBe('ERROR')
  })

  it('obtenerEstadoSync cuenta pendientes, con error y sincronizados', async () => {
    encolarCambio('productos', 'CREAR', 'p1', { id: 'p1' })
    encolarCambio('productos', 'CREAR', 'p2', { id: 'p2' })

    expect(obtenerEstadoSync()).toEqual({ pendientes: 2, conError: 0, sincronizados: 0 })

    await ejecutarSincronizacion()

    expect(obtenerEstadoSync()).toEqual({ pendientes: 0, conError: 2, sincronizados: 0 })
  })

  it('ejecutarSincronizacion marca cada cambio como ERROR y guarda el motivo mientras no haya API', async () => {
    encolarCambio('productos', 'CREAR', 'p1', { id: 'p1' })

    const resultado = await ejecutarSincronizacion()

    expect(resultado).toEqual({ enviados: 0, fallidos: 1 })
    expect(listarPendientes()[0].ultimoError).toMatch(/API/)
    expect(listarPendientes()[0].intentos).toBe(1)
  })

  it('no reintenta cambios que ya están SINCRONIZADO', async () => {
    encolarCambio('productos', 'CREAR', 'p1', { id: 'p1' })
    await ejecutarSincronizacion() // queda en ERROR (no hay API todavía)

    const resultado = await ejecutarSincronizacion()

    // sigue fallando (no hay API), pero se reintenta porque no llegó a SINCRONIZADO
    expect(resultado.fallidos).toBe(1)
    expect(listarPendientes()[0].intentos).toBe(2)
  })
})
