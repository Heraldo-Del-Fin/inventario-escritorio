import { randomUUID } from 'crypto'
import type {
  CambioPendiente,
  EntidadSincronizable,
  EstadoSincronizacion,
  OperacionSync
} from '@shared/types'
import { readCollection, writeCollection } from '../store/localStore'

export const CAMBIOS_PENDIENTES_COLLECTION = 'cambios_pendientes'

export function encolarCambio(
  entidad: EntidadSincronizable,
  operacion: OperacionSync,
  entidadId: string,
  payload: unknown
): CambioPendiente {
  const cambios = readCollection<CambioPendiente>(CAMBIOS_PENDIENTES_COLLECTION)
  const cambio: CambioPendiente = {
    id: randomUUID(),
    entidad,
    operacion,
    entidadId,
    payload,
    creadoEn: new Date().toISOString(),
    estado: 'PENDIENTE',
    intentos: 0
  }

  writeCollection(CAMBIOS_PENDIENTES_COLLECTION, [...cambios, cambio])
  return cambio
}

export function listarPendientes(): CambioPendiente[] {
  return readCollection<CambioPendiente>(CAMBIOS_PENDIENTES_COLLECTION).filter(
    (cambio) => cambio.estado !== 'SINCRONIZADO'
  )
}

export function obtenerEstadoSync(): EstadoSincronizacion {
  const cambios = readCollection<CambioPendiente>(CAMBIOS_PENDIENTES_COLLECTION)
  return {
    pendientes: cambios.filter((c) => c.estado === 'PENDIENTE').length,
    conError: cambios.filter((c) => c.estado === 'ERROR').length,
    sincronizados: cambios.filter((c) => c.estado === 'SINCRONIZADO').length
  }
}

/**
 * Placeholder: acá se conecta la llamada HTTP real cuando la API exista.
 * Hasta entonces, cualquier intento de sincronizar falla de forma controlada
 * y el cambio queda marcado como ERROR (no se pierde ni se descarta).
 */
async function enviarCambioApi(_cambio: CambioPendiente): Promise<void> {
  throw new Error('La API todavía no está configurada')
}

export async function ejecutarSincronizacion(): Promise<{ enviados: number; fallidos: number }> {
  const cambios = readCollection<CambioPendiente>(CAMBIOS_PENDIENTES_COLLECTION)
  let enviados = 0
  let fallidos = 0

  for (const cambio of cambios) {
    if (cambio.estado === 'SINCRONIZADO') continue

    try {
      await enviarCambioApi(cambio)
      cambio.estado = 'SINCRONIZADO'
      cambio.sincronizadoEn = new Date().toISOString()
      enviados++
    } catch (error) {
      cambio.estado = 'ERROR'
      cambio.intentos += 1
      cambio.ultimoError = error instanceof Error ? error.message : String(error)
      fallidos++
    }
  }

  writeCollection(CAMBIOS_PENDIENTES_COLLECTION, cambios)
  return { enviados, fallidos }
}
