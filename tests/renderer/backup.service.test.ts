import { beforeEach, describe, expect, it } from 'vitest'
import { installMockWindowApi } from '../helpers/mockWindowApi'
import { backupService } from '@/services/backup.service'

describe('backup.service', () => {
  let api: ReturnType<typeof installMockWindowApi>

  beforeEach(() => {
    api = installMockWindowApi()
  })

  it('crear delega en window.api.backup.crear', async () => {
    api.backup.crear.mockResolvedValue('2026-01-01T00-00-00-000Z')
    await expect(backupService.crear()).resolves.toBe('2026-01-01T00-00-00-000Z')
  })

  it('listar delega en window.api.backup.listar', async () => {
    api.backup.listar.mockResolvedValue(['2026-01-01T00-00-00-000Z'])
    await expect(backupService.listar()).resolves.toEqual(['2026-01-01T00-00-00-000Z'])
  })

  it('restaurar delega el nombre en window.api.backup.restaurar', async () => {
    api.backup.restaurar.mockResolvedValue(undefined)
    await backupService.restaurar('2026-01-01T00-00-00-000Z')
    expect(api.backup.restaurar).toHaveBeenCalledWith('2026-01-01T00-00-00-000Z')
  })
})
