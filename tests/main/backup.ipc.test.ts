import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IpcChannels } from '@shared/ipc-channels'
import { createIpcMainMock } from '../helpers/mockIpc'

let userDataDir: string
const ipc = createIpcMainMock()

vi.mock('electron', () => ({
  ipcMain: ipc.ipcMain,
  app: { getPath: () => userDataDir }
}))

const { registerBackupIpc } = await import('@main/ipc/backup.ipc')
registerBackupIpc()

describe('backup.ipc', () => {
  beforeEach(() => {
    userDataDir = mkdtempSync(join(tmpdir(), 'inventario-escritorio-backup-ipc-test-'))
    mkdirSync(join(userDataDir, 'data'), { recursive: true })
  })

  afterEach(() => {
    rmSync(userDataDir, { recursive: true, force: true })
  })

  it('crear devuelve null sin datos, y el nombre del respaldo cuando hay datos', async () => {
    expect(await ipc.invoke(IpcChannels.BACKUP_CREAR)).toBeNull()

    writeFileSync(join(userDataDir, 'data', 'productos.json'), '[]', 'utf-8')
    const nombre = await ipc.invoke<string>(IpcChannels.BACKUP_CREAR)
    expect(nombre).toBeTruthy()
    expect(await ipc.invoke(IpcChannels.BACKUP_LISTAR)).toEqual([nombre])
  })

  it('restaurar con un nombre inválido rechaza la operación', async () => {
    await expect(ipc.invoke(IpcChannels.BACKUP_RESTAURAR, '../../etc')).rejects.toThrowError(
      /inválido/
    )
  })
})
