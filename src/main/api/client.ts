import { getSesion, limpiarSesion, setSesion } from './session'

const BASE_URL: string = import.meta.env.MAIN_VITE_API_URL ?? 'http://localhost:3000/api/v1'

interface RespuestaError {
  codigo: string
  mensaje: string
}

/** `codigo`/`status` permiten a los callers distinguir casos (p. ej. 404 → null) sin parsear el mensaje. */
export class ApiError extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
    public readonly status: number
  ) {
    super(mensaje)
    this.name = 'ApiError'
  }
}

interface TokensRefrescados {
  accessToken: string
  refreshToken: string
}

/**
 * `fetch` nativo, cuando no logra conectar (servidor caído, puerto equivocado, firewall, etc.),
 * lanza un `TypeError: fetch failed` genérico — la causa real (ECONNREFUSED, ENOTFOUND, timeout...)
 * queda escondida en `error.cause`. Acá se la saca a la luz para que el mensaje sea accionable.
 */
async function fetchConCausa(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch (error) {
    const causa =
      error instanceof Error && error.cause instanceof Error ? error.cause.message : undefined
    const detalle = causa ?? (error instanceof Error ? error.message : String(error))
    throw new Error(`No se pudo conectar con la API en ${BASE_URL}: ${detalle}`)
  }
}

/** Un solo intento de refresh por request fallido — si también falla, la sesión se cierra. */
async function refrescarSesion(): Promise<boolean> {
  const sesion = getSesion()
  if (!sesion) return false

  const respuesta = await fetchConCausa(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: sesion.refreshToken })
  })

  if (!respuesta.ok) {
    limpiarSesion()
    return false
  }

  const tokens = (await respuesta.json()) as TokensRefrescados
  setSesion({ ...sesion, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
  return true
}

async function solicitar<T>(
  metodo: string,
  ruta: string,
  cuerpo: unknown,
  reintentarSi401: boolean
): Promise<T> {
  const sesion = getSesion()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (sesion) headers.Authorization = `Bearer ${sesion.accessToken}`

  const respuesta = await fetchConCausa(`${BASE_URL}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
  })

  if (respuesta.status === 401 && reintentarSi401 && (await refrescarSesion())) {
    return solicitar<T>(metodo, ruta, cuerpo, false)
  }

  if (!respuesta.ok) {
    const error = (await respuesta.json().catch(() => null)) as RespuestaError | null
    throw new ApiError(
      error?.codigo ?? 'ERROR_DESCONOCIDO',
      error?.mensaje ?? `Error ${respuesta.status} al llamar a la API`,
      respuesta.status
    )
  }

  if (respuesta.status === 204) return undefined as T
  return (await respuesta.json()) as T
}

export const apiClient = {
  get: <T>(ruta: string): Promise<T> => solicitar<T>('GET', ruta, undefined, true),
  post: <T>(ruta: string, cuerpo?: unknown): Promise<T> => solicitar<T>('POST', ruta, cuerpo, true),
  patch: <T>(ruta: string, cuerpo?: unknown): Promise<T> =>
    solicitar<T>('PATCH', ruta, cuerpo, true),
  delete: <T>(ruta: string): Promise<T> => solicitar<T>('DELETE', ruta, undefined, true)
}
