export interface Producto {
  id: string
  sku: string
  nombre: string
  descripcion?: string
  precio: number
  stock: number
  stockMinimo: number
  proveedorId?: string
  /** Imagen del producto como data URL (base64), ej. "data:image/png;base64,...". */
  imagenUrl?: string
  /** Soft-delete: `false` cuando se "elimina" (nunca se borra la fila). `undefined`/`true` = activo. */
  activo?: boolean
  creadoEn: string
  actualizadoEn: string
}

export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE'

export interface MovimientoInventario {
  id: string
  productoId: string
  tipo: TipoMovimiento
  cantidad: number
  motivo?: string
  /** Quién lo generó — lo completa el renderer con el usuario logueado (ver auth.store). */
  usuarioId?: string
  creadoEn: string
}

export interface Proveedor {
  id: string
  nombre: string
  contacto?: string
  telefono?: string
  email?: string
  /** Proveedor sembrado por la app para usar como default cuando no se elige uno real. No se puede eliminar. */
  esGeneral?: boolean
}

export interface Cliente {
  id: string
  nombre: string
  telefono?: string
  email?: string
  /** Cliente sembrado por la app para usar como default cuando no se elige uno real. No se puede eliminar. */
  esGeneral?: boolean
}

export interface ItemVenta {
  productoId: string
  cantidad: number
  precioUnitario: number
}

export interface Venta {
  id: string
  clienteId?: string
  usuarioId?: string
  items: ItemVenta[]
  total: number
  creadoEn: string
}

export interface ItemCompra {
  productoId: string
  cantidad: number
}

export interface OrdenCompra {
  id: string
  proveedorId?: string
  usuarioId?: string
  items: ItemCompra[]
  creadoEn: string
}

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: 'ADMIN' | 'VENDEDOR' | 'ALMACEN'
}

export interface Sucursal {
  id: string
  nombre: string
  /** La sucursal sembrada por la API al arrancar. No se puede eliminar. */
  esPrincipal: boolean
  creadoEn: string
}

export interface Credenciales {
  email: string
  password: string
}

export interface SesionAuth {
  usuario: Usuario
}

export type EntidadSincronizable =
  'productos' | 'movimientos' | 'ventas' | 'compras' | 'proveedores' | 'clientes'
export type OperacionSync = 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR'
export type EstadoSync = 'PENDIENTE' | 'SINCRONIZADO' | 'ERROR'

export interface CambioPendiente {
  id: string
  entidad: EntidadSincronizable
  operacion: OperacionSync
  entidadId: string
  payload: unknown
  creadoEn: string
  estado: EstadoSync
  intentos: number
  ultimoError?: string
  sincronizadoEn?: string
}

export interface EstadoSincronizacion {
  pendientes: number
  conError: number
  sincronizados: number
}
