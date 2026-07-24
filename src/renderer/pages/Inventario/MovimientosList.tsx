import { type JSX, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button, Table, Tabs, Typography, type TableColumnsType } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { MovimientoInventario, Producto } from '@shared/types'
import { useInventario } from '@/hooks/useInventario'
import { useProductos } from '@/hooks/useProductos'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

function construirColumnas(
  productos: Producto[],
  signo: '+' | '-' | null
): TableColumnsType<MovimientoInventario> {
  return [
    {
      title: 'Producto',
      dataIndex: 'productoId',
      render: (productoId: string) =>
        productos.find((p) => p.id === productoId)?.nombre ?? productoId
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      render: (cantidad: number) => (
        <span style={{ color: signo === '+' ? '#16a34a' : signo === '-' ? '#dc2626' : undefined }}>
          {signo ? `${signo}${cantidad}` : cantidad}
        </span>
      )
    },
    {
      title: 'Fecha y hora',
      dataIndex: 'creadoEn',
      render: (creadoEn: string) => new Date(creadoEn).toLocaleString()
    }
  ]
}

export function MovimientosList(): JSX.Element {
  const { movimientos, cargando, error } = useInventario()
  const { productos } = useProductos()

  const ordenados = useMemo(
    () => [...movimientos].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)),
    [movimientos]
  )

  const salidas = ordenados.filter((m) => m.tipo === 'SALIDA')
  const entradas = ordenados.filter((m) => m.tipo === 'ENTRADA')
  const ajustes = ordenados.filter((m) => m.tipo === 'AJUSTE')

  return (
    <section>
      <VolverDashboard />
      <header className="mb-4 flex items-center justify-between">
        <Typography.Title level={3} className="!mb-0">
          Inventario
        </Typography.Title>
        <Link to="/inventario/ajuste">
          <Button type="primary" icon={<PlusOutlined />}>
            Registrar ajuste
          </Button>
        </Link>
      </header>

      <ErrorAlert mensaje={error} />

      <Tabs
        items={[
          {
            key: 'salidas',
            label: `Salidas y ventas (${salidas.length})`,
            children: (
              <Table
                rowKey="id"
                loading={cargando}
                columns={construirColumnas(productos, '-')}
                dataSource={salidas}
                pagination={{ pageSize: 10 }}
              />
            )
          },
          {
            key: 'entradas',
            label: `Productos añadidos (${entradas.length})`,
            children: (
              <Table
                rowKey="id"
                loading={cargando}
                columns={construirColumnas(productos, '+')}
                dataSource={entradas}
                pagination={{ pageSize: 10 }}
              />
            )
          },
          {
            key: 'ajustes',
            label: `Ajustes (${ajustes.length})`,
            children: (
              <Table
                rowKey="id"
                loading={cargando}
                columns={construirColumnas(productos, null)}
                dataSource={ajustes}
                pagination={{ pageSize: 10 }}
              />
            )
          }
        ]}
      />
    </section>
  )
}
