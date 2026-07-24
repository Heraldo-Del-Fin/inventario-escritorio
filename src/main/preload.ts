import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/ipc-channels'
import type {
  CambioPendiente,
  Cliente,
  Credenciales,
  EstadoSincronizacion,
  MovimientoInventario,
  OrdenCompra,
  Producto,
  Proveedor,
  SesionAuth,
  Usuario,
  Venta
} from '@shared/types'

type UsuarioNuevo = { nombre: string; email: string; rol: Usuario['rol']; password: string }
type UsuarioCambios = { nombre?: string; email?: string; rol?: Usuario['rol']; password?: string }
type ProductoNuevo = Omit<Producto, 'id' | 'creadoEn' | 'actualizadoEn'>
type MovimientoNuevo = Omit<MovimientoInventario, 'id' | 'creadoEn'>
type VentaNueva = Omit<Venta, 'id' | 'creadoEn' | 'total'>
type CompraNueva = Omit<OrdenCompra, 'id' | 'creadoEn'>
type ProveedorNuevo = Omit<Proveedor, 'id'>
type ClienteNuevo = Omit<Cliente, 'id'>

const api = {
  auth: {
    login: (credenciales: Credenciales): Promise<SesionAuth> =>
      ipcRenderer.invoke(IpcChannels.AUTH_LOGIN, credenciales)
  },
  usuarios: {
    listar: (): Promise<Usuario[]> => ipcRenderer.invoke(IpcChannels.USUARIOS_LISTAR),
    obtener: (id: string): Promise<Usuario | null> =>
      ipcRenderer.invoke(IpcChannels.USUARIOS_OBTENER, id),
    crear: (usuario: UsuarioNuevo): Promise<Usuario> =>
      ipcRenderer.invoke(IpcChannels.USUARIOS_CREAR, usuario),
    actualizar: (id: string, cambios: UsuarioCambios): Promise<Usuario> =>
      ipcRenderer.invoke(IpcChannels.USUARIOS_ACTUALIZAR, id, cambios),
    eliminar: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.USUARIOS_ELIMINAR, id)
  },
  productos: {
    listar: (): Promise<Producto[]> => ipcRenderer.invoke(IpcChannels.PRODUCTOS_LISTAR),
    obtener: (id: string): Promise<Producto | null> =>
      ipcRenderer.invoke(IpcChannels.PRODUCTOS_OBTENER, id),
    crear: (producto: ProductoNuevo): Promise<Producto> =>
      ipcRenderer.invoke(IpcChannels.PRODUCTOS_CREAR, producto),
    actualizar: (id: string, cambios: Partial<Producto>): Promise<Producto> =>
      ipcRenderer.invoke(IpcChannels.PRODUCTOS_ACTUALIZAR, id, cambios),
    eliminar: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.PRODUCTOS_ELIMINAR, id)
  },
  inventario: {
    listarMovimientos: (): Promise<MovimientoInventario[]> =>
      ipcRenderer.invoke(IpcChannels.INVENTARIO_LISTAR_MOVIMIENTOS),
    registrarMovimiento: (movimiento: MovimientoNuevo): Promise<MovimientoInventario> =>
      ipcRenderer.invoke(IpcChannels.INVENTARIO_REGISTRAR_MOVIMIENTO, movimiento)
  },
  ventas: {
    listar: (): Promise<Venta[]> => ipcRenderer.invoke(IpcChannels.VENTAS_LISTAR),
    crear: (venta: VentaNueva): Promise<Venta> =>
      ipcRenderer.invoke(IpcChannels.VENTAS_CREAR, venta)
  },
  compras: {
    listar: (): Promise<OrdenCompra[]> => ipcRenderer.invoke(IpcChannels.COMPRAS_LISTAR),
    crear: (compra: CompraNueva): Promise<OrdenCompra> =>
      ipcRenderer.invoke(IpcChannels.COMPRAS_CREAR, compra)
  },
  proveedores: {
    listar: (): Promise<Proveedor[]> => ipcRenderer.invoke(IpcChannels.PROVEEDORES_LISTAR),
    obtener: (id: string): Promise<Proveedor | null> =>
      ipcRenderer.invoke(IpcChannels.PROVEEDORES_OBTENER, id),
    crear: (proveedor: ProveedorNuevo): Promise<Proveedor> =>
      ipcRenderer.invoke(IpcChannels.PROVEEDORES_CREAR, proveedor),
    actualizar: (id: string, cambios: Partial<Proveedor>): Promise<Proveedor> =>
      ipcRenderer.invoke(IpcChannels.PROVEEDORES_ACTUALIZAR, id, cambios),
    eliminar: (id: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.PROVEEDORES_ELIMINAR, id)
  },
  clientes: {
    listar: (): Promise<Cliente[]> => ipcRenderer.invoke(IpcChannels.CLIENTES_LISTAR),
    obtener: (id: string): Promise<Cliente | null> =>
      ipcRenderer.invoke(IpcChannels.CLIENTES_OBTENER, id),
    crear: (cliente: ClienteNuevo): Promise<Cliente> =>
      ipcRenderer.invoke(IpcChannels.CLIENTES_CREAR, cliente),
    actualizar: (id: string, cambios: Partial<Cliente>): Promise<Cliente> =>
      ipcRenderer.invoke(IpcChannels.CLIENTES_ACTUALIZAR, id, cambios),
    eliminar: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.CLIENTES_ELIMINAR, id)
  },
  impresion: {
    imprimirTicket: (ventaId: string): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.IMPRESION_IMPRIMIR_TICKET, ventaId)
  },
  sync: {
    listarPendientes: (): Promise<CambioPendiente[]> =>
      ipcRenderer.invoke(IpcChannels.SYNC_LISTAR_PENDIENTES),
    estado: (): Promise<EstadoSincronizacion> => ipcRenderer.invoke(IpcChannels.SYNC_ESTADO),
    ejecutar: (): Promise<{ enviados: number; fallidos: number }> =>
      ipcRenderer.invoke(IpcChannels.SYNC_EJECUTAR)
  },
  backup: {
    crear: (): Promise<string | null> => ipcRenderer.invoke(IpcChannels.BACKUP_CREAR),
    listar: (): Promise<string[]> => ipcRenderer.invoke(IpcChannels.BACKUP_LISTAR),
    restaurar: (nombre: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.BACKUP_RESTAURAR, nombre)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
