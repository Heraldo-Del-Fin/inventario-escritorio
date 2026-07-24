import { beforeEach, describe, expect, it } from 'vitest'
import { installMockWindowApi } from '../helpers/mockWindowApi'
import { syncService } from '@/services/sync.service'
import type { CambioPendiente } from '@shared/types'

const cambio: CambioPendiente = {
  id: 'c1',
  entidad: 'productos',
  operacion: 'CREAR',
  entidadId: 'p1',
  payload: { id: 'p1' },
  creadoEn: '2026-01-01T00:00:00.000Z',
  estado: 'PENDIENTE',
  intentos: 0
}

describe('sync.service', () => {
  let api: ReturnType<typeof installMockWindowApi>

  beforeEach(() => {
    api = installMockWindowApi()
  })

  it('listarPendientes delega en window.api.sync.listarPendientes', async () => {
    api.sync.listarPendientes.mockResolvedValue([cambio])
    await expect(syncService.listarPendientes()).resolves.toEqual([cambio])
  })

  it('estado delega en window.api.sync.estado', async () => {
    api.sync.estado.mockResolvedValue({ pendientes: 1, conError: 0, sincronizados: 0 })
    await expect(syncService.estado()).resolves.toEqual({
      pendientes: 1,
      conError: 0,
      sincronizados: 0
    })
  })

  it('ejecutar delega en window.api.sync.ejecutar', async () => {
    api.sync.ejecutar.mockResolvedValue({ enviados: 0, fallidos: 1 })
    await expect(syncService.ejecutar()).resolves.toEqual({ enviados: 0, fallidos: 1 })
  })
})
