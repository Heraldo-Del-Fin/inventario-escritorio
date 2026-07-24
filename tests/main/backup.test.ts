import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let userDataDir: string

vi.mock('electron', () => ({
  app: {
    getPath: () => userDataDir
  }
}))

const { crearRespaldo, listarRespaldos, restaurarRespaldo } = await import('@main/backup/backup')

function escribirDato(nombre: string, contenido: unknown): void {
  writeFileSync(join(userDataDir, 'data', `${nombre}.json`), JSON.stringify(contenido), 'utf-8')
}

describe('backup', () => {
  beforeEach(() => {
    userDataDir = mkdtempSync(join(tmpdir(), 'inventario-escritorio-backup-test-'))
    const dataDir = join(userDataDir, 'data')
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  })

  afterEach(() => {
    rmSync(userDataDir, { recursive: true, force: true })
  })

  it('devuelve null si todavía no hay datos que respaldar', () => {
    expect(crearRespaldo()).toBeNull()
  })

  it('copia los archivos de datos a una carpeta de respaldo con timestamp', () => {
    escribirDato('productos', [{ id: 'p1' }])

    const nombre = crearRespaldo()

    expect(nombre).toBeTruthy()
    expect(listarRespaldos()).toContain(nombre)

    const copiado = readFileSync(
      join(userDataDir, 'backups', nombre as string, 'productos.json'),
      'utf-8'
    )
    expect(JSON.parse(copiado)).toEqual([{ id: 'p1' }])
  })

  it('listarRespaldos devuelve los más recientes primero', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    escribirDato('productos', [{ id: 'p1' }])
    const primero = crearRespaldo()

    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'))
    escribirDato('productos', [{ id: 'p1' }, { id: 'p2' }])
    const segundo = crearRespaldo()
    vi.useRealTimers()

    expect(listarRespaldos()).toEqual([segundo, primero])
  })

  it('restaurarRespaldo devuelve los datos al estado del respaldo elegido', () => {
    escribirDato('productos', [{ id: 'p1' }])
    const respaldoBueno = crearRespaldo() as string

    escribirDato('productos', [{ id: 'p1' }, { id: 'corrupto' }])

    restaurarRespaldo(respaldoBueno)

    const actual = readFileSync(join(userDataDir, 'data', 'productos.json'), 'utf-8')
    expect(JSON.parse(actual)).toEqual([{ id: 'p1' }])
  })

  it('restaurarRespaldo rechaza un nombre que no exista', () => {
    expect(() => restaurarRespaldo('2026-01-01T00-00-00-000Z')).toThrowError(/no encontrado/)
  })

  it('restaurarRespaldo rechaza intentos de path traversal', () => {
    expect(() => restaurarRespaldo('../../etc')).toThrowError(/inválido/)
  })

  it('no guarda más de 10 respaldos: descarta los más viejos al crear uno nuevo', () => {
    vi.useFakeTimers()
    const base = new Date('2026-01-01T00:00:00.000Z').getTime()

    for (let i = 0; i < 12; i++) {
      vi.setSystemTime(new Date(base + i * 1000))
      escribirDato('productos', [{ id: `p${i}` }])
      crearRespaldo()
    }
    vi.useRealTimers()

    const respaldos = listarRespaldos()
    expect(respaldos).toHaveLength(10)
    // se conservan los 10 más recientes (índices 2..11 de la secuencia generada)
    expect(respaldos[0]).toBe(new Date(base + 11 * 1000).toISOString().replace(/[:.]/g, '-'))
  })
})
