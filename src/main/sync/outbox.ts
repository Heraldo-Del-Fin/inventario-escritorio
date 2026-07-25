import { randomUUID } from 'crypto'
import type {
  CambioPendiente,
  EntidadSincronizable,
  EstadoSincronizacion,
  OperacionSync
} from '@shared/types'
import { apiClient } from '../api/client'
import { getSesion } from '../api/session'
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

const RUTAS: Record<EntidadSincronizable, string> = {
  productos: '/productos',
  proveedores: '/proveedores',
  clientes: '/clientes',
  ventas: '/ventas',
  compras: '/compras',
  movimientos: '/movimientos'
}

/**
 * Cada entidad local tiene más campos de los que la API acepta en el body (ids/timestamps
 * que la API gestiona sola, `esGeneral`, `activo`, `total`/`usuarioId` recalculados server-side,
 * etc.). Con `forbidNonWhitelisted` activo en la API, mandar un campo de más devuelve 400 —
 * por eso acá se arma explícitamente qué va en cada request en vez de reenviar el payload tal cual.
 */
const CAMPOS_CREAR: Record<EntidadSincronizable, string[]> = {
  productos: [
    'id',
    'sku',
    'nombre',
    'descripcion',
    'precio',
    'stock',
    'stockMinimo',
    'proveedorId',
    'imagenUrl',
    'creadoEn'
  ],
  proveedores: ['id', 'nombre', 'contacto', 'telefono', 'email'],
  clientes: ['id', 'nombre', 'telefono', 'email'],
  ventas: ['id', 'clienteId', 'items', 'sucursalId', 'creadoEn'],
  compras: ['id', 'proveedorId', 'items', 'sucursalId', 'creadoEn'],
  movimientos: ['id', 'productoId', 'tipo', 'cantidad', 'motivo', 'sucursalId', 'creadoEn']
}

/** Solo productos/proveedores/clientes tienen PATCH en la API — ventas/compras/movimientos son solo-creación. */
const CAMPOS_ACTUALIZAR: Partial<Record<EntidadSincronizable, string[]>> = {
  productos: ['sku', 'nombre', 'descripcion', 'precio', 'stockMinimo', 'proveedorId', 'imagenUrl'],
  proveedores: ['nombre', 'contacto', 'telefono', 'email'],
  clientes: ['nombre', 'telefono', 'email']
}

function pick(payload: unknown, campos: string[]): Record<string, unknown> {
  const objeto = (payload ?? {}) as Record<string, unknown>
  const resultado: Record<string, unknown> = {}
  for (const campo of campos) {
    if (objeto[campo] !== undefined) resultado[campo] = objeto[campo]
  }
  return resultado
}

async function enviarCambioApi(cambio: CambioPendiente): Promise<void> {
  if (!getSesion()) {
    throw new Error('No hay sesión activa para sincronizar')
  }

  const ruta = RUTAS[cambio.entidad]

  if (cambio.operacion === 'CREAR') {
    await apiClient.post(ruta, pick(cambio.payload, CAMPOS_CREAR[cambio.entidad]))
    return
  }

  if (cambio.operacion === 'ACTUALIZAR') {
    const campos = CAMPOS_ACTUALIZAR[cambio.entidad]
    if (!campos) {
      throw new Error(`"${cambio.entidad}" no admite actualizaciones en la API`)
    }
    await apiClient.patch(`${ruta}/${cambio.entidadId}`, pick(cambio.payload, campos))
    return
  }

  await apiClient.delete(`${ruta}/${cambio.entidadId}`)
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
