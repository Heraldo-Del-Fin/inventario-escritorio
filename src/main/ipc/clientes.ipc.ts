import { randomUUID } from 'crypto'
import { ipcMain } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type { Cliente } from '@shared/types'
import { readCollection, writeCollection } from '../store/localStore'
import { encolarCambio } from '../sync/outbox'

const COLLECTION = 'clientes'

type ClienteNuevo = Omit<Cliente, 'id'>

function seedClienteGeneral(): void {
  const clientes = readCollection<Cliente>(COLLECTION)
  if (clientes.some((c) => c.esGeneral)) return

  const general: Cliente = {
    id: randomUUID(),
    nombre: 'Cliente general',
    esGeneral: true
  }

  writeCollection(COLLECTION, [general, ...clientes])
}

export function registerClientesIpc(): void {
  seedClienteGeneral()

  ipcMain.handle(IpcChannels.CLIENTES_LISTAR, async (): Promise<Cliente[]> => {
    return readCollection<Cliente>(COLLECTION)
  })

  ipcMain.handle(
    IpcChannels.CLIENTES_OBTENER,
    async (_event, id: string): Promise<Cliente | null> => {
      const clientes = readCollection<Cliente>(COLLECTION)
      return clientes.find((c) => c.id === id) ?? null
    }
  )

  ipcMain.handle(
    IpcChannels.CLIENTES_CREAR,
    async (_event, datos: ClienteNuevo): Promise<Cliente> => {
      const clientes = readCollection<Cliente>(COLLECTION)
      const cliente: Cliente = { ...datos, id: randomUUID(), esGeneral: false }
      writeCollection(COLLECTION, [...clientes, cliente])
      encolarCambio('clientes', 'CREAR', cliente.id, cliente)
      return cliente
    }
  )

  ipcMain.handle(
    IpcChannels.CLIENTES_ACTUALIZAR,
    async (_event, id: string, cambios: Partial<Cliente>): Promise<Cliente> => {
      const clientes = readCollection<Cliente>(COLLECTION)
      const indice = clientes.findIndex((c) => c.id === id)

      if (indice === -1) {
        throw new Error(`Cliente ${id} no encontrado`)
      }

      const actualizado: Cliente = {
        ...clientes[indice],
        ...cambios,
        id,
        esGeneral: clientes[indice].esGeneral
      }
      clientes[indice] = actualizado
      writeCollection(COLLECTION, clientes)
      encolarCambio('clientes', 'ACTUALIZAR', actualizado.id, actualizado)
      return actualizado
    }
  )

  ipcMain.handle(IpcChannels.CLIENTES_ELIMINAR, async (_event, id: string): Promise<void> => {
    const clientes = readCollection<Cliente>(COLLECTION)
    const cliente = clientes.find((c) => c.id === id)

    if (cliente?.esGeneral) {
      throw new Error('No se puede eliminar el cliente general')
    }

    writeCollection(
      COLLECTION,
      clientes.filter((c) => c.id !== id)
    )
    encolarCambio('clientes', 'ELIMINAR', id, null)
  })
}
