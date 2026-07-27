import { apiClient } from './client'

// Render (plan free) duerme la API tras ~15 min sin pedidos. Se pinguea bastante
// antes de ese límite para que, mientras la app esté abierta, nunca llegue a dormirse
// (evita el "cuelgue" de 30-50s en frío que se ve como si algo no cargara).
const INTERVALO_MS = 10 * 60 * 1000

let intervalo: ReturnType<typeof setInterval> | null = null

async function ping(): Promise<void> {
  try {
    await apiClient.get('/health')
  } catch {
    // Si falla (sin red, API caída), no hay nada que hacer acá: el próximo pedido
    // real de todos modos la despierta, este ping es solo una optimización.
  }
}

export function iniciarKeepAlive(): void {
  if (intervalo) return
  void ping()
  intervalo = setInterval(() => void ping(), INTERVALO_MS)
}

export function detenerKeepAlive(): void {
  if (intervalo) {
    clearInterval(intervalo)
    intervalo = null
  }
}
