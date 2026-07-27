import { type JSX, useEffect, useState } from 'react'
import { Table, Tag, Typography, type TableColumnsType } from 'antd'
import type { InventarioPorSucursalItem } from '@shared/types'
import { productosService } from '@/services/productos.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export function InventarioSucursales(): JSX.Element {
  const [inventario, setInventario] = useState<InventarioPorSucursalItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    productosService
      .listarInventarioPorSucursal()
      .then(setInventario)
      .catch(() => setError('No se pudo cargar el inventario por sucursal'))
      .finally(() => setCargando(false))
  }, [])

  const columnas: TableColumnsType<InventarioPorSucursalItem> = [
    { title: 'Producto', dataIndex: 'productoNombre' },
    { title: 'Sucursal', dataIndex: 'sucursalNombre' },
    {
      title: 'Stock',
      dataIndex: 'stock',
      render: (stock: number, item) =>
        stock <= item.stockMinimo ? (
          <>
            {stock} <Tag color="red">Stock bajo</Tag>
          </>
        ) : (
          stock
        )
    },
    { title: 'Stock mínimo', dataIndex: 'stockMinimo' }
  ]

  return (
    <section>
      <VolverDashboard />
      <Typography.Title level={3}>Inventario por sucursal</Typography.Title>
      <Typography.Paragraph type="secondary">
        Qué producto tiene stock y en cuál sucursal (solo se listan combinaciones con stock
        mayor a 0).
      </Typography.Paragraph>

      <ErrorAlert mensaje={error} />

      <Table
        rowKey={(item) => `${item.productoId}-${item.sucursalId}`}
        loading={cargando}
        columns={columnas}
        dataSource={inventario}
        pagination={{ pageSize: 20 }}
      />
    </section>
  )
}
