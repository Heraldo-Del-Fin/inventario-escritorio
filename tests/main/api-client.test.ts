import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiClient } from '@main/api/client'
import { getSesion, limpiarSesion, setSesion } from '@main/api/session'

function mockRespuesta(status: number, cuerpo: unknown): Response {
  const texto = cuerpo === undefined ? '' : JSON.stringify(cuerpo)
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(cuerpo),
    text: vi.fn().mockResolvedValue(texto)
  } as unknown as Response
}

describe('api/client', () => {
  beforeEach(() => {
    limpiarSesion()
    vi.restoreAllMocks()
  })

  it('llama sin Authorization cuando no hay sesión', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockRespuesta(200, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    const resultado = await apiClient.get<{ ok: boolean }>('/health')

    expect(resultado).toEqual({ ok: true })
    const [, opciones] = fetchMock.mock.calls[0]
    expect(opciones.headers.Authorization).toBeUndefined()
  })

  it('adjunta el access token cuando hay sesión activa', async () => {
    setSesion({
      usuario: { id: 'u1', nombre: 'A', email: 'a@x.com', rol: 'ADMIN' },
      accessToken: 'access-1',
      refreshToken: 'refresh-1'
    })
    const fetchMock = vi.fn().mockResolvedValue(mockRespuesta(200, []))
    vi.stubGlobal('fetch', fetchMock)

    await apiClient.get('/productos')

    const [, opciones] = fetchMock.mock.calls[0]
    expect(opciones.headers.Authorization).toBe('Bearer access-1')
  })

  it('ante un 401 refresca el token y reintenta una sola vez', async () => {
    setSesion({
      usuario: { id: 'u1', nombre: 'A', email: 'a@x.com', rol: 'ADMIN' },
      accessToken: 'vencido',
      refreshToken: 'refresh-1'
    })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockRespuesta(401, { codigo: 'NO_AUTENTICADO', mensaje: 'Vencido' }))
      .mockResolvedValueOnce(
        mockRespuesta(200, { accessToken: 'nuevo-access', refreshToken: 'nuevo-refresh' })
      )
      .mockResolvedValueOnce(mockRespuesta(200, { datos: [] }))
    vi.stubGlobal('fetch', fetchMock)

    const resultado = await apiClient.get<{ datos: unknown[] }>('/productos')

    expect(resultado).toEqual({ datos: [] })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh')
    expect(getSesion()?.accessToken).toBe('nuevo-access')
    // El reintento usa el token nuevo, no el vencido.
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer nuevo-access')
  })

  it('si el refresh también falla, cierra la sesión y lanza el error original', async () => {
    setSesion({
      usuario: { id: 'u1', nombre: 'A', email: 'a@x.com', rol: 'ADMIN' },
      accessToken: 'vencido',
      refreshToken: 'refresh-vencido'
    })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockRespuesta(401, { codigo: 'NO_AUTENTICADO', mensaje: 'Sesión vencida' }))
      .mockResolvedValueOnce(mockRespuesta(401, { codigo: 'REFRESH_TOKEN_INVALIDO', mensaje: 'Expiró' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient.get('/productos')).rejects.toThrowError(/Sesión vencida/)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(getSesion()).toBeNull()
  })

  it('un error de negocio (4xx que no es 401) se propaga con el mensaje de la API', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockRespuesta(409, { codigo: 'SKU_DUPLICADO', mensaje: 'SKU ya usado' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient.post('/productos', { sku: 'X' })).rejects.toThrowError(/SKU ya usado/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('el error lanzado es un ApiError con código y status (para que el caller distinga casos, ej. 404)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockRespuesta(404, { codigo: 'USUARIO_NO_ENCONTRADO', mensaje: 'No existe' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient.get('/usuarios/x')).rejects.toMatchObject({
      codigo: 'USUARIO_NO_ENCONTRADO',
      status: 404
    })
    await expect(apiClient.get('/usuarios/x')).rejects.toBeInstanceOf(ApiError)
  })

  it('si fetch ni siquiera pudo conectar, muestra la causa real en vez de "fetch failed" a secas', async () => {
    const causa = new Error('connect ECONNREFUSED 127.0.0.1:3000')
    const fetchFailed = new TypeError('fetch failed')
    ;(fetchFailed as { cause?: unknown }).cause = causa
    const fetchMock = vi.fn().mockRejectedValue(fetchFailed)
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient.get('/health')).rejects.toThrowError(/ECONNREFUSED 127\.0\.0\.1:3000/)
  })

  it('un 204 sin contenido no intenta parsear JSON', async () => {
    const respuesta = mockRespuesta(204, undefined)
    const fetchMock = vi.fn().mockResolvedValue(respuesta)
    vi.stubGlobal('fetch', fetchMock)

    const resultado = await apiClient.delete('/productos/p1')

    expect(resultado).toBeUndefined()
    expect(respuesta.json).not.toHaveBeenCalled()
  })

  it('un 200 con body vacío tampoco revienta (algunos DELETE de la API responden así, no siempre 204)', async () => {
    const respuesta = mockRespuesta(200, undefined)
    const fetchMock = vi.fn().mockResolvedValue(respuesta)
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient.delete('/usuarios/u1')).resolves.toBeUndefined()
  })
})
