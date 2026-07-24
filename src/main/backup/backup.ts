import { app } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs'
import { basename, join } from 'path'

const MAX_RESPALDOS = 10
const NOMBRE_VALIDO = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/

function getDataDir(): string {
  return join(app.getPath('userData'), 'data')
}

function getBackupsDir(): string {
  return join(app.getPath('userData'), 'backups')
}

function limpiarRespaldosViejos(): void {
  const dir = getBackupsDir()
  if (!existsSync(dir)) return

  const respaldos = readdirSync(dir).sort()
  const sobrantes = respaldos.length - MAX_RESPALDOS

  for (let i = 0; i < sobrantes; i++) {
    rmSync(join(dir, respaldos[i]), { recursive: true, force: true })
  }
}

/** Copia los archivos de datos actuales a una carpeta de respaldo con timestamp. */
export function crearRespaldo(): string | null {
  const origen = getDataDir()
  if (!existsSync(origen)) return null

  const archivos = readdirSync(origen).filter((archivo) => archivo.endsWith('.json'))
  if (archivos.length === 0) return null

  const nombre = new Date().toISOString().replace(/[:.]/g, '-')
  const destino = join(getBackupsDir(), nombre)
  mkdirSync(destino, { recursive: true })

  for (const archivo of archivos) {
    copyFileSync(join(origen, archivo), join(destino, archivo))
  }

  limpiarRespaldosViejos()
  return nombre
}

export function listarRespaldos(): string[] {
  const dir = getBackupsDir()
  if (!existsSync(dir)) return []
  return readdirSync(dir).sort().reverse()
}

export function restaurarRespaldo(nombre: string): void {
  const nombreSeguro = basename(nombre)
  if (!NOMBRE_VALIDO.test(nombreSeguro)) {
    throw new Error('Nombre de respaldo inválido')
  }

  const origen = join(getBackupsDir(), nombreSeguro)
  if (!existsSync(origen)) {
    throw new Error('Respaldo no encontrado')
  }

  crearRespaldo()

  const destino = getDataDir()
  mkdirSync(destino, { recursive: true })
  for (const archivo of readdirSync(origen)) {
    copyFileSync(join(origen, archivo), join(destino, archivo))
  }
}
