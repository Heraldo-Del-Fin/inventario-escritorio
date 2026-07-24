import type { JSX } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { ProductosList } from '@/pages/Productos/ProductosList'
import { ProductoForm } from '@/pages/Productos/ProductoForm'
import { ProductoDetalle } from '@/pages/Productos/ProductoDetalle'
import { MovimientosList } from '@/pages/Inventario/MovimientosList'
import { AjusteInventario } from '@/pages/Inventario/AjusteInventario'
import { ProveedoresList } from '@/pages/Proveedores/ProveedoresList'
import { ProveedorForm } from '@/pages/Proveedores/ProveedorForm'
import { HistorialCompras } from '@/pages/Compras/HistorialCompras'
import { NuevaCompra } from '@/pages/Compras/NuevaCompra'
import { ClientesList } from '@/pages/Clientes/ClientesList'
import { ClienteForm } from '@/pages/Clientes/ClienteForm'
import { NuevaVenta } from '@/pages/Ventas/NuevaVenta'
import { HistorialVentas } from '@/pages/Ventas/HistorialVentas'
import { Reportes } from '@/pages/Reportes'
import { Configuracion } from '@/pages/Configuracion'
import { UsuariosList } from '@/pages/Configuracion/UsuariosList'
import { UsuarioForm } from '@/pages/Configuracion/UsuarioForm'
import { Respaldos } from '@/pages/Configuracion/Respaldos'
import { RequireAuth } from './RequireAuth'
import { RequireRole } from './RequireRole'

export function AppRouter(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />

        <Route path="/productos" element={<ProductosList />} />
        <Route path="/productos/nuevo" element={<ProductoForm />} />
        <Route path="/productos/:id" element={<ProductoDetalle />} />
        <Route path="/productos/:id/editar" element={<ProductoForm />} />

        <Route path="/inventario" element={<MovimientosList />} />
        <Route path="/inventario/ajuste" element={<AjusteInventario />} />

        <Route path="/proveedores" element={<ProveedoresList />} />
        <Route path="/proveedores/nuevo" element={<ProveedorForm />} />
        <Route path="/proveedores/:id/editar" element={<ProveedorForm />} />

        <Route path="/compras" element={<HistorialCompras />} />
        <Route path="/compras/nueva" element={<NuevaCompra />} />

        <Route path="/clientes" element={<ClientesList />} />
        <Route path="/clientes/nuevo" element={<ClienteForm />} />
        <Route path="/clientes/:id/editar" element={<ClienteForm />} />

        <Route path="/ventas" element={<HistorialVentas />} />
        <Route path="/ventas/nueva" element={<NuevaVenta />} />

        <Route path="/reportes" element={<Reportes />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route
          path="/configuracion/usuarios"
          element={
            <RequireRole roles={['ADMIN']}>
              <UsuariosList />
            </RequireRole>
          }
        />
        <Route
          path="/configuracion/usuarios/nuevo"
          element={
            <RequireRole roles={['ADMIN']}>
              <UsuarioForm />
            </RequireRole>
          }
        />
        <Route
          path="/configuracion/usuarios/:id"
          element={
            <RequireRole roles={['ADMIN']}>
              <UsuarioForm />
            </RequireRole>
          }
        />
        <Route
          path="/configuracion/respaldos"
          element={
            <RequireRole roles={['ADMIN']}>
              <Respaldos />
            </RequireRole>
          }
        />
      </Route>
    </Routes>
  )
}
