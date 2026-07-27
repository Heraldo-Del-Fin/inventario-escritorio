import type { JSX } from 'react'
import { Link } from 'react-router-dom'
import { Button, Table, Typography, type TableColumnsType } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Transferencia } from '@shared/types'
import { useTransferencias } from '@/hooks/useTransferencias'
import { useProductos } from '@/hooks/useProductos'
import { useSucursales } from '@/hooks/useSucursales'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export function HistorialTransferencias(): JSX.Element {
  const { transferencias, cargando, error } = useTransferencias()
  const { productos } = useProductos()
  const { sucursales } = useSucursales()

  const nombreSucursal = (id: string): string => sucursales.find((s) => s.id === id)?.nombre ?? id

  const columnas: TableColumnsType<Transferencia> = [
    {
      title: 'Fecha y hora',
      dataIndex: 'creadoEn',
      render: (creadoEn: string) => new Date(creadoEn).toLocaleString()
    },
    {
      title: 'Producto',
      dataIndex: 'productoId',
      render: (productoId: string) =>
        productos.find((p) => p.id === productoId)?.nombre ?? productoId
    },
    {
      title: 'Origen',
      dataIndex: 'sucursalOrigenId',
      render: nombreSucursal
    },
    {
      title: 'Destino',
      dataIndex: 'sucursalDestinoId',
      render: nombreSucursal
    },
    { title: 'Cantidad', dataIndex: 'cantidad' },
    {
      title: 'Motivo',
      dataIndex: 'motivo',
      render: (motivo?: string) => motivo ?? '—'
    }
  ]

  return (
    <section>
      <VolverDashboard />
      <header className="mb-4 flex items-center justify-between">
        <Typography.Title level={3} className="!mb-0">
          Transferencias entre sucursales
        </Typography.Title>
        <Link to="/configuracion/transferencias/nueva">
          <Button type="primary" icon={<PlusOutlined />}>
            Nueva transferencia
          </Button>
        </Link>
      </header>

      <ErrorAlert mensaje={error} />

      <Table
        rowKey="id"
        loading={cargando}
        columns={columnas}
        dataSource={transferencias}
        pagination={{ pageSize: 10 }}
      />
    </section>
  )
}
