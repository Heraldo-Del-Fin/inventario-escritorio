import { randomUUID } from 'crypto'
import type { Usuario } from '@shared/types'
import { readCollection, writeCollection } from '../store/localStore'
import { hashPassword } from './password'

const COLLECTION = 'usuarios'

interface UsuarioConCredenciales extends Usuario {
  passwordHash: string
}

export interface UsuarioNuevo {
  nombre: string
  email: string
  rol: Usuario['rol']
  password: string
}

export interface UsuarioCambios {
  nombre?: string
  email?: string
  rol?: Usuario['rol']
  password?: string
}

export function listarUsuariosConCredenciales(): UsuarioConCredenciales[] {
  return readCollection<UsuarioConCredenciales>(COLLECTION)
}

export function buscarPorEmail(email: string): UsuarioConCredenciales | undefined {
  const emailNormalizado = email.trim().toLowerCase()
  return listarUsuariosConCredenciales().find((u) => u.email.toLowerCase() === emailNormalizado)
}

export function sinCredenciales(usuario: UsuarioConCredenciales): Usuario {
  const { passwordHash: _passwordHash, ...usuarioPublico } = usuario
  return usuarioPublico
}

export function listarUsuarios(): Usuario[] {
  return listarUsuariosConCredenciales().map(sinCredenciales)
}

export function obtenerUsuario(id: string): Usuario | undefined {
  const usuario = listarUsuariosConCredenciales().find((u) => u.id === id)
  return usuario ? sinCredenciales(usuario) : undefined
}

export function crearUsuario(datos: UsuarioNuevo): Usuario {
  const usuarios = listarUsuariosConCredenciales()
  const emailNormalizado = datos.email.trim().toLowerCase()

  if (usuarios.some((u) => u.email.toLowerCase() === emailNormalizado)) {
    throw new Error(`Ya existe un usuario con el correo ${datos.email}`)
  }

  const nuevo: UsuarioConCredenciales = {
    id: randomUUID(),
    nombre: datos.nombre,
    email: datos.email,
    rol: datos.rol,
    passwordHash: hashPassword(datos.password)
  }

  writeCollection(COLLECTION, [...usuarios, nuevo])
  return sinCredenciales(nuevo)
}

export function actualizarUsuario(id: string, cambios: UsuarioCambios): Usuario {
  const usuarios = listarUsuariosConCredenciales()
  const indice = usuarios.findIndex((u) => u.id === id)

  if (indice === -1) {
    throw new Error(`Usuario ${id} no encontrado`)
  }

  if (cambios.email) {
    const emailNormalizado = cambios.email.trim().toLowerCase()
    const duplicado = usuarios.some(
      (u, i) => i !== indice && u.email.toLowerCase() === emailNormalizado
    )
    if (duplicado) {
      throw new Error(`Ya existe un usuario con el correo ${cambios.email}`)
    }
  }

  const actualizado: UsuarioConCredenciales = {
    ...usuarios[indice],
    nombre: cambios.nombre ?? usuarios[indice].nombre,
    email: cambios.email ?? usuarios[indice].email,
    rol: cambios.rol ?? usuarios[indice].rol,
    passwordHash: cambios.password ? hashPassword(cambios.password) : usuarios[indice].passwordHash
  }

  usuarios[indice] = actualizado
  writeCollection(COLLECTION, usuarios)
  return sinCredenciales(actualizado)
}

export function eliminarUsuario(id: string): void {
  const usuarios = listarUsuariosConCredenciales()
  const usuario = usuarios.find((u) => u.id === id)
  if (!usuario) return

  const admins = usuarios.filter((u) => u.rol === 'ADMIN')
  if (usuario.rol === 'ADMIN' && admins.length <= 1) {
    throw new Error('No se puede eliminar el único usuario administrador')
  }

  writeCollection(
    COLLECTION,
    usuarios.filter((u) => u.id !== id)
  )
}

export function seedAdminPorDefecto(): void {
  const usuarios = listarUsuariosConCredenciales()
  if (usuarios.length > 0) return

  const admin: UsuarioConCredenciales = {
    id: randomUUID(),
    nombre: 'Administrador',
    email: 'admin@inventario.local',
    rol: 'ADMIN',
    passwordHash: hashPassword('admin123')
  }

  writeCollection(COLLECTION, [admin])

  console.log(
    '[auth] Se creó un usuario administrador por defecto:\n' +
      '  email: admin@inventario.local\n' +
      '  password: admin123\n' +
      '  (cámbialo apenas exista una pantalla de gestión de usuarios)'
  )
}
