export const IpcChannels = {
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',

  USUARIOS_LISTAR: 'usuarios:listar',
  USUARIOS_OBTENER: 'usuarios:obtener',
  USUARIOS_CREAR: 'usuarios:crear',
  USUARIOS_ACTUALIZAR: 'usuarios:actualizar',
  USUARIOS_ELIMINAR: 'usuarios:eliminar',

  PRODUCTOS_LISTAR: 'productos:listar',
  PRODUCTOS_OBTENER: 'productos:obtener',
  PRODUCTOS_CREAR: 'productos:crear',
  PRODUCTOS_ACTUALIZAR: 'productos:actualizar',
  PRODUCTOS_ELIMINAR: 'productos:eliminar',
  PRODUCTOS_OBTENER_STOCK_POR_SUCURSAL: 'productos:obtener-stock-por-sucursal',
  PRODUCTOS_LISTAR_INVENTARIO_POR_SUCURSAL: 'productos:listar-inventario-por-sucursal',

  INVENTARIO_LISTAR_MOVIMIENTOS: 'inventario:listar-movimientos',
  INVENTARIO_REGISTRAR_MOVIMIENTO: 'inventario:registrar-movimiento',

  VENTAS_LISTAR: 'ventas:listar',
  VENTAS_CREAR: 'ventas:crear',

  COMPRAS_LISTAR: 'compras:listar',
  COMPRAS_CREAR: 'compras:crear',

  PROVEEDORES_LISTAR: 'proveedores:listar',
  PROVEEDORES_OBTENER: 'proveedores:obtener',
  PROVEEDORES_CREAR: 'proveedores:crear',
  PROVEEDORES_ACTUALIZAR: 'proveedores:actualizar',
  PROVEEDORES_ELIMINAR: 'proveedores:eliminar',

  SUCURSALES_LISTAR: 'sucursales:listar',
  SUCURSALES_OBTENER: 'sucursales:obtener',
  SUCURSALES_CREAR: 'sucursales:crear',
  SUCURSALES_ACTUALIZAR: 'sucursales:actualizar',
  SUCURSALES_ELIMINAR: 'sucursales:eliminar',

  CLIENTES_LISTAR: 'clientes:listar',
  CLIENTES_OBTENER: 'clientes:obtener',
  CLIENTES_CREAR: 'clientes:crear',
  CLIENTES_ACTUALIZAR: 'clientes:actualizar',
  CLIENTES_ELIMINAR: 'clientes:eliminar',

  TRANSFERENCIAS_LISTAR: 'transferencias:listar',
  TRANSFERENCIAS_CREAR: 'transferencias:crear',

  IMPRESION_IMPRIMIR_TICKET: 'impresion:imprimir-ticket',

  SYNC_LISTAR_PENDIENTES: 'sync:listar-pendientes',
  SYNC_ESTADO: 'sync:estado',
  SYNC_EJECUTAR: 'sync:ejecutar',

  BACKUP_CREAR: 'backup:crear',
  BACKUP_LISTAR: 'backup:listar',
  BACKUP_RESTAURAR: 'backup:restaurar'
} as const
