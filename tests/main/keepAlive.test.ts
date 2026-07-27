import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const apiClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }

vi.mock('@main/api/client', () => ({ apiClient }))

const { detenerKeepAlive, iniciarKeepAlive } = await import('@main/api/keepAlive')

describe('keepAlive', () => {
  beforeEach(() => {
    apiClient.get.mockReset().mockResolvedValue({ estado: 'ok' })
    vi.useFakeTimers()
  })

  afterEach(() => {
    detenerKeepAlive()
    vi.useRealTimers()
  })

  it('pinguea /health apenas arranca, sin esperar el primer intervalo', () => {
    iniciarKeepAlive()
    expect(apiClient.get).toHaveBeenCalledWith('/health')
    expect(apiClient.get).toHaveBeenCalledTimes(1)
  })

  it('repite el ping cada 10 minutos mientras la app esté abierta', async () => {
    iniciarKeepAlive()

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    expect(apiClient.get).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    expect(apiClient.get).toHaveBeenCalledTimes(3)
  })

  it('no arranca un segundo intervalo si ya está corriendo', async () => {
    iniciarKeepAlive()
    iniciarKeepAlive()

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    expect(apiClient.get).toHaveBeenCalledTimes(2)
  })

  it('detenerKeepAlive para los pings siguientes', async () => {
    iniciarKeepAlive()
    detenerKeepAlive()

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000)
    expect(apiClient.get).toHaveBeenCalledTimes(1)
  })

  it('si un ping falla, no rompe nada ni corta el intervalo', async () => {
    apiClient.get.mockReset().mockRejectedValue(new Error('sin red'))
    iniciarKeepAlive()

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    expect(apiClient.get).toHaveBeenCalledTimes(2)
  })
})
