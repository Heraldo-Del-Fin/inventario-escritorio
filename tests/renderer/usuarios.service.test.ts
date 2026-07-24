import { beforeEach, describe, expect, it } from 'vitest'
import { installMockWindowApi } from '../helpers/mockWindowApi'
import { usuariosService } from '@/services/usuarios.service'
import type { Usuario } from '@shared/types'

const usuario: Usuario = { id: 'u1', nombre: 'Ana', email: 'ana@x.com', rol: 'VENDEDOR' }

describe('usuarios.service', () => {
  let api: ReturnType<typeof installMockWindowApi>

  beforeEach(() => {
    api = installMockWindowApi()
  })

  it('listar delega en window.api.usuarios.listar', async () => {
    api.usuarios.listar.mockResolvedValue([usuario])
    await expect(usuariosService.listar()).resolves.toEqual([usuario])
  })

  it('obtener lanza un error si window.api devuelve null', async () => {
    api.usuarios.obtener.mockResolvedValue(null)
    await expect(usuariosService.obtener('no-existe')).rejects.toThrowError(/no encontrado/)
  })

  it('crear delega los datos en window.api.usuarios.crear', async () => {
    api.usuarios.crear.mockResolvedValue(usuario)
    const datos = {
      nombre: 'Ana',
      email: 'ana@x.com',
      rol: 'VENDEDOR' as const,
      password: '123456'
    }
    await usuariosService.crear(datos)
    expect(api.usuarios.crear).toHaveBeenCalledWith(datos)
  })
})
