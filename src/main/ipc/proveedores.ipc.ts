import { randomUUID } from 'crypto'
import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { Proveedor } from '@shared/types'
import { readCollection, writeCollection } from '../store/localStore'
import { encolarCambio } from '../sync/outbox'

const COLLECTION = 'proveedores'

type ProveedorNuevo = Omit<Proveedor, 'id'>

function seedProveedorGeneral(): void {
  const proveedores = readCollection<Proveedor>(COLLECTION)
  if (proveedores.some((p) => p.esGeneral)) return

  const general: Proveedor = {
    id: randomUUID(),
    nombre: 'Proveedor general',
    esGeneral: true
  }

  writeCollection(COLLECTION, [general, ...proveedores])
  // La API no siembra un proveedor general propio (esGeneral siempre queda en false ahí) —
  // sin encolar esto, cualquier producto/compra que lo referencie fallaría al sincronizar
  // porque el proveedor nunca llegó a existir en la API.
  encolarCambio('proveedores', 'CREAR', general.id, general)
}

export function registerProveedoresIpc(): void {
  seedProveedorGeneral()

  ipcMain.handle(IpcChannels.PROVEEDORES_LISTAR, async (): Promise<Proveedor[]> => {
    return readCollection<Proveedor>(COLLECTION)
  })

  ipcMain.handle(
    IpcChannels.PROVEEDORES_OBTENER,
    async (_event, id: string): Promise<Proveedor | null> => {
      const proveedores = readCollection<Proveedor>(COLLECTION)
      return proveedores.find((p) => p.id === id) ?? null
    }
  )

  ipcMain.handle(
    IpcChannels.PROVEEDORES_CREAR,
    async (_event, datos: ProveedorNuevo): Promise<Proveedor> => {
      const proveedores = readCollection<Proveedor>(COLLECTION)
      const proveedor: Proveedor = { ...datos, id: randomUUID(), esGeneral: false }
      writeCollection(COLLECTION, [...proveedores, proveedor])
      encolarCambio('proveedores', 'CREAR', proveedor.id, proveedor)
      return proveedor
    }
  )

  ipcMain.handle(
    IpcChannels.PROVEEDORES_ACTUALIZAR,
    async (_event, id: string, cambios: Partial<Proveedor>): Promise<Proveedor> => {
      const proveedores = readCollection<Proveedor>(COLLECTION)
      const indice = proveedores.findIndex((p) => p.id === id)

      if (indice === -1) {
        throw new Error(`Proveedor ${id} no encontrado`)
      }

      const actualizado: Proveedor = {
        ...proveedores[indice],
        ...cambios,
        id,
        esGeneral: proveedores[indice].esGeneral
      }
      proveedores[indice] = actualizado
      writeCollection(COLLECTION, proveedores)
      encolarCambio('proveedores', 'ACTUALIZAR', actualizado.id, actualizado)
      return actualizado
    }
  )

  ipcMain.handle(IpcChannels.PROVEEDORES_ELIMINAR, async (_event, id: string): Promise<void> => {
    const proveedores = readCollection<Proveedor>(COLLECTION)
    const proveedor = proveedores.find((p) => p.id === id)

    if (proveedor?.esGeneral) {
      throw new Error('No se puede eliminar el proveedor general')
    }

    writeCollection(
      COLLECTION,
      proveedores.filter((p) => p.id !== id)
    )
    encolarCambio('proveedores', 'ELIMINAR', id, null)
  })
}
