import type { Usuario } from '@shared/types'

export interface Sesion {
  usuario: Usuario
  accessToken: string
  refreshToken: string
}

let sesionActual: Sesion | null = null

export function setSesion(sesion: Sesion): void {
  sesionActual = sesion
}

export function getSesion(): Sesion | null {
  return sesionActual
}

export function limpiarSesion(): void {
  sesionActual = null
}
