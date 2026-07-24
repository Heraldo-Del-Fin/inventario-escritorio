import type { JSX } from 'react'
import { Link } from 'react-router-dom'
import { Button, Table, Typography, type TableColumnsType } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Venta } from '@shared/types'
import { useVentas } from '@/hooks/useVentas'
import { useClientes } from '@/hooks/useClientes'
import { useProductos } from '@/hooks/useProductos'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export function HistorialVentas(): JSX.Element {
  const { ventas, cargando, error } = useVentas()
  const { clientes } = useClientes()
  const { productos } = useProductos()

  const columnas: TableColumnsType<Venta> = [
    {
      title: 'Fecha y hora',
      dataIndex: 'creadoEn',
      render: (creadoEn: string) => new Date(creadoEn).toLocaleString()
    },
    {
      title: 'Cliente',
      dataIndex: 'clienteId',
      render: (clienteId?: string) =>
        clientes.find((c) => c.id === clienteId)?.nombre ?? 'Sin cliente'
    },
    {
      title: 'Productos',
      key: 'productos',
      render: (_, venta) => `${venta.items.length} producto(s)`
    },
    {
      title: 'Total',
      dataIndex: 'total',
      render: (total: number) => `$${total}`
    }
  ]

  return (
    <section>
      <VolverDashboard />
      <header className="mb-4 flex items-center justify-between">
        <Typography.Title level={3} className="!mb-0">
          Ventas
        </Typography.Title>
        <Link to="/ventas/nueva">
          <Button type="primary" icon={<PlusOutlined />}>
            Nueva venta
          </Button>
        </Link>
      </header>

      <ErrorAlert mensaje={error} />

      <Table
        rowKey="id"
        loading={cargando}
        columns={columnas}
        dataSource={ventas}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (venta) => (
            <ul className="m-0 list-disc pl-5">
              {venta.items.map((item) => {
                const producto = productos.find((p) => p.id === item.productoId)
                const conDescuento = Boolean(producto && item.precioUnitario < producto.precio)
                return (
                  <li key={item.productoId}>
                    {producto?.nombre ?? item.productoId} — cantidad: {item.cantidad} — precio: $
                    {item.precioUnitario}
                    {conDescuento && ' (con descuento)'}
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
