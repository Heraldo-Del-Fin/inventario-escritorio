import type { JSX } from 'react'
import { Link } from 'react-router-dom'
import { Button, Table, Typography, type TableColumnsType } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { OrdenCompra } from '@shared/types'
import { useCompras } from '@/hooks/useCompras'
import { useProveedores } from '@/hooks/useProveedores'
import { useProductos } from '@/hooks/useProductos'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export function HistorialCompras(): JSX.Element {
  const { compras, cargando, error } = useCompras()
  const { proveedores } = useProveedores()
  const { productos } = useProductos()

  const columnas: TableColumnsType<OrdenCompra> = [
    {
      title: 'Fecha y hora',
      dataIndex: 'creadoEn',
      render: (creadoEn: string) => new Date(creadoEn).toLocaleString()
    },
    {
      title: 'Proveedor',
      dataIndex: 'proveedorId',
      render: (proveedorId?: string) =>
        proveedores.find((p) => p.id === proveedorId)?.nombre ?? 'Sin proveedor'
    },
    {
      title: 'Productos',
      key: 'productos',
      render: (_, compra) => `${compra.items.length} producto(s)`
    }
  ]

  return (
    <section>
      <VolverDashboard />
      <header className="mb-4 flex items-center justify-between">
        <Typography.Title level={3} className="!mb-0">
          Compras
        </Typography.Title>
        <Link to="/compras/nueva">
          <Button type="primary" icon={<PlusOutlined />}>
            Nueva compra
          </Button>
        </Link>
      </header>

      <ErrorAlert mensaje={error} />

      <Table
        rowKey="id"
        loading={cargando}
        columns={columnas}
        dataSource={compras}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (compra) => (
            <ul className="m-0 list-disc pl-5">
              {compra.items.map((item) => {
                const producto = productos.find((p) => p.id === item.productoId)
                return (
                  <li key={item.productoId}>
                    {producto?.nombre ?? item.productoId} — cantidad: {item.cantidad}
                  </li>
                )
              })}
            </ul>
          )
        }}
      />
    </section>
  )
}
