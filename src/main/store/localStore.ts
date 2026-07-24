import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

function getDataDir(): string {
  const dir = join(app.getPath('userData'), 'data')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

function getCollectionPath(name: string): string {
  return join(getDataDir(), `${name}.json`)
}

export function readCollection<T>(name: string): T[] {
  const path = getCollectionPath(name)
  if (!existsSync(path)) return []
  const raw = readFileSync(path, 'utf-8')
  return raw.trim() ? (JSON.parse(raw) as T[]) : []
}

export function writeCollection<T>(name: string, data: T[]): void {
  writeFileSync(getCollectionPath(name), JSON.stringify(data, null, 2), 'utf-8')
}
