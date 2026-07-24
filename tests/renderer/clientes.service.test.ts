import { beforeEach, describe, expect, it } from 'vitest'
import { installMockWindowApi } from '../helpers/mockWindowApi'
import { clientesService } from '@/services/clientes.service'
import type { Cliente } from '@shared/types'

const cliente: Cliente = { id: 'c1', nombre: 'Juan' }

describe('clientes.service', () => {
  let api: ReturnType<typeof installMockWindowApi>

  beforeEach(() => {
    api = installMockWindowApi()
  })

  it('listar delega en window.api.clientes.listar', async () => {
    api.clientes.listar.mockResolvedValue([cliente])
    await expect(clientesService.listar()).resolves.toEqual([cliente])
  })

  it('obtener lanza un error si window.api devuelve null', async () => {
    api.clientes.obtener.mockResolvedValue(null)
    await expect(clientesService.obtener('no-existe')).rejects.toThrowError(/no encontrado/)
  })
})
