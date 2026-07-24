import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let userDataDir: string

vi.mock('electron', () => ({
  app: {
    getPath: () => userDataDir
  }
}))

const { readCollection, writeCollection } = await import('@main/store/localStore')

describe('localStore', () => {
  beforeEach(() => {
    userDataDir = mkdtempSync(join(tmpdir(), 'inventario-escritorio-test-'))
  })

  afterEach(() => {
    rmSync(userDataDir, { recursive: true, force: true })
  })

  it('devuelve un array vacío si la colección todavía no existe', () => {
    expect(readCollection('productos')).toEqual([])
  })

  it('persiste y vuelve a leer una colección', () => {
    writeCollection('productos', [{ id: '1', nombre: 'Tornillo' }])
    const leido = readCollection<{ id: string; nombre: string }>('productos')

    expect(leido).toEqual([{ id: '1', nombre: 'Tornillo' }])
  })

  it('cada colección se guarda en su propio archivo, sin mezclarse', () => {
    writeCollection('productos', [{ id: 'p1' }])
    writeCollection('clientes', [{ id: 'c1' }])

    expect(readCollection('productos')).toEqual([{ id: 'p1' }])
    expect(readCollection('clientes')).toEqual([{ id: 'c1' }])
  })
})
