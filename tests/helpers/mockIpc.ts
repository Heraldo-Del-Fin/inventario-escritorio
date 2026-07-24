import { vi } from 'vitest'

type Handler = (event: unknown, ...args: never[]) => unknown

export function createIpcMainMock() {
  const handlers = new Map<string, Handler>()

  const ipcMain = {
    handle: vi.fn((channel: string, handler: Handler) => {
      handlers.set(channel, handler)
    })
  }

  function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
    const handler = handlers.get(channel)
    if (!handler) {
      throw new Error(`No hay ningún handler registrado para el canal "${channel}"`)
    }
    return Promise.resolve(handler(null, ...(args as never[]))) as Promise<T>
  }

  return { ipcMain, handlers, invoke }
}
