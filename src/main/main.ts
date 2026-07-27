import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './windows/createMainWindow'
import { registerAuthIpc } from './ipc/auth.ipc'
import { registerUsuariosIpc } from './ipc/usuarios.ipc'
import { registerSucursalesIpc } from './ipc/sucursales.ipc'
import { registerProductosIpc } from './ipc/productos.ipc'
import { registerInventarioIpc } from './ipc/inventario.ipc'
import { registerVentasIpc } from './ipc/ventas.ipc'
import { registerComprasIpc } from './ipc/compras.ipc'
import { registerProveedoresIpc } from './ipc/proveedores.ipc'
import { registerClientesIpc } from './ipc/clientes.ipc'
import { registerTransferenciasIpc } from './ipc/transferencias.ipc'
import { registerImpresionIpc } from './ipc/impresion.ipc'
import { registerSyncIpc } from './ipc/sync.ipc'
import { registerBackupIpc } from './ipc/backup.ipc'
import { crearRespaldo } from './backup/backup'
import { detenerKeepAlive, iniciarKeepAlive } from './api/keepAlive'

app.whenReady().then(() => {
  // Respaldo del estado actual de los datos antes de cualquier otra cosa: si esta
  // versión de la app viene de una actualización/reinstalación que corrompe o
  // pierde algo, queda un respaldo del último estado bueno conocido.
  crearRespaldo()

  registerAuthIpc()
  registerUsuariosIpc()
  registerSucursalesIpc()
  registerProductosIpc()
  registerInventarioIpc()
  registerVentasIpc()
  registerComprasIpc()
  registerProveedoresIpc()
  registerClientesIpc()
  registerTransferenciasIpc()
  registerImpresionIpc()
  registerSyncIpc()
  registerBackupIpc()

  iniciarKeepAlive()

  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  detenerKeepAlive()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
