import { beforeEach, describe, expect, it } from 'vitest'
import { installMockWindowApi } from '../helpers/mockWindowApi'
import { proveedoresService } from '@/services/proveedores.service'
import type { Proveedor } from '@shared/types'

const proveedor: Proveedor = { id: 'pr1', nombre: 'Acme' }

describe('proveedores.service', () => {
  let api: ReturnType<typeof installMockWindowApi>

  beforeEach(() => {
    api = installMockWindowApi()
  })

  it('listar delega en window.api.proveedores.listar', async () => {
    api.proveedores.listar.mockResolvedValue([proveedor])
    await expect(proveedoresService.listar()).resolves.toEqual([proveedor])
  })

  it('obtener lanza un error si window.api devuelve null', async () => {
    api.proveedores.obtener.mockResolvedValue(null)
    await expect(proveedoresService.obtener('no-existe')).rejects.toThrowError(/no encontrado/)
  })

  it('actualizar delega id y cambios', async () => {
    api.proveedores.actualizar.mockResolvedValue(proveedor)
    await proveedoresService.actualizar('pr1', { nombre: 'Otro' })
    expect(api.proveedores.actualizar).toHaveBeenCalledWith('pr1', { nombre: 'Otro' })
  })
})
