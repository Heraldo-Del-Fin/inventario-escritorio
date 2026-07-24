import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createLocalStoreMock } from '../helpers/mockLocalStore'

const store = createLocalStoreMock()

vi.mock('@main/store/localStore', () => ({
  readCollection: store.readCollection,
  writeCollection: store.writeCollection
}))

const {
  actualizarUsuario,
  buscarPorEmail,
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
  seedAdminPorDefecto
} = await import('@main/auth/usuarios.repository')

describe('usuarios.repository', () => {
  beforeEach(() => {
    store.reset()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('seedAdminPorDefecto', () => {
    it('crea un admin si no hay usuarios', () => {
      seedAdminPorDefecto()
      const usuarios = listarUsuarios()
      expect(usuarios).toHaveLength(1)
      expect(usuarios[0].rol).toBe('ADMIN')
      expect(usuarios[0].email).toBe('admin@inventario.local')
    })

    it('es idempotente: no duplica el admin en llamadas sucesivas', () => {
      seedAdminPorDefecto()
      seedAdminPorDefecto()
      expect(listarUsuarios()).toHaveLength(1)
    })

    it('no crea el admin si ya hay algún usuario', () => {
      crearUsuario({ nombre: 'Vendedor', email: 'v@x.com', rol: 'VENDEDOR', password: '123456' })
      seedAdminPorDefecto()
      expect(listarUsuarios()).toHaveLength(1)
    })
  })

  describe('crearUsuario', () => {
    it('crea un usuario y no expone el hash de la contraseña', () => {
      const usuario = crearUsuario({
        nombre: 'Ana',
        email: 'ana@x.com',
        rol: 'VENDEDOR',
        password: '123456'
      })
      expect(usuario).not.toHaveProperty('passwordHash')
      expect(usuario.email).toBe('ana@x.com')
    })

    it('rechaza un email duplicado (case-insensitive)', () => {
      crearUsuario({ nombre: 'Ana', email: 'ana@x.com', rol: 'VENDEDOR', password: '123456' })
      expect(() =>
        crearUsuario({ nombre: 'Otra', email: 'ANA@X.COM', rol: 'ALMACEN', password: '123456' })
      ).toThrowError(/Ya existe un usuario/)
    })
  })

  describe('actualizarUsuario', () => {
    it('lanza si el usuario no existe', () => {
      expect(() => actualizarUsuario('no-existe', { nombre: 'X' })).toThrowError(/no encontrado/)
    })

    it('permite editar el propio email de un usuario sin chocar consigo mismo', () => {
      const usuario = crearUsuario({
        nombre: 'Ana',
        email: 'ana@x.com',
        rol: 'VENDEDOR',
        password: '123456'
      })
      expect(() => actualizarUsuario(usuario.id, { email: 'ana@x.com' })).not.toThrow()
    })

    it('rechaza cambiar el email a uno que ya usa otro usuario', () => {
      crearUsuario({ nombre: 'Ana', email: 'ana@x.com', rol: 'VENDEDOR', password: '123456' })
      const otro = crearUsuario({
        nombre: 'Beto',
        email: 'beto@x.com',
        rol: 'VENDEDOR',
        password: '123456'
      })
      expect(() => actualizarUsuario(otro.id, { email: 'ana@x.com' })).toThrowError(
        /Ya existe un usuario/
      )
    })

    it('deja la contraseña sin tocar si no se manda una nueva', () => {
      const usuario = crearUsuario({
        nombre: 'Ana',
        email: 'ana@x.com',
        rol: 'VENDEDOR',
        password: '123456'
      })
      const antes = store.data.get('usuarios') as { passwordHash: string }[]
      actualizarUsuario(usuario.id, { nombre: 'Ana María' })
      const despues = store.data.get('usuarios') as { passwordHash: string }[]
      expect(despues[0].passwordHash).toBe(antes[0].passwordHash)
    })
  })

  describe('eliminarUsuario', () => {
    it('no deja eliminar al único admin', () => {
      seedAdminPorDefecto()
      const [admin] = listarUsuarios()
      expect(() => eliminarUsuario(admin.id)).toThrowError(/único usuario administrador/)
    })

    it('permite eliminar un admin si hay otro admin', () => {
      seedAdminPorDefecto()
      const admin2 = crearUsuario({
        nombre: 'Admin 2',
        email: 'admin2@x.com',
        rol: 'ADMIN',
        password: '123456'
      })
      const [admin1] = listarUsuarios()
      expect(() => eliminarUsuario(admin1.id)).not.toThrow()
      expect(listarUsuarios().map((u) => u.id)).toEqual([admin2.id])
    })

    it('permite eliminar un usuario no-admin sin restricciones', () => {
      seedAdminPorDefecto()
      const vendedor = crearUsuario({
        nombre: 'Vendedor',
        email: 'v@x.com',
        rol: 'VENDEDOR',
        password: '123456'
      })
      eliminarUsuario(vendedor.id)
      expect(listarUsuarios().find((u) => u.id === vendedor.id)).toBeUndefined()
    })
  })

  describe('buscarPorEmail', () => {
    it('encuentra por email ignorando mayúsculas y espacios', () => {
      crearUsuario({ nombre: 'Ana', email: 'ana@x.com', rol: 'VENDEDOR', password: '123456' })
      expect(buscarPorEmail('  ANA@X.COM  ')?.email).toBe('ana@x.com')
    })
  })
})
