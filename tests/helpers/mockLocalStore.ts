import { vi } from 'vitest'

export function createLocalStoreMock() {
  const data = new Map<string, unknown[]>()

  const readCollection = vi.fn(<T>(name: string): T[] => (data.get(name) as T[]) ?? [])
  const writeCollection = vi.fn(<T>(name: string, value: T[]): void => {
    data.set(name, value)
  })

  return {
    readCollection,
    writeCollection,
    data,
    reset: () => data.clear()
  }
}
