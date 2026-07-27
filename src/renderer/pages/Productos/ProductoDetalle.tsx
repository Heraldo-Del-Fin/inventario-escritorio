import { type JSX, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Producto, StockPorSucursalItem } from '@shared/types'
import { productosService } from '@/services/productos.service'
import { useProveedores } from '@/hooks/useProveedores'
import { useAuth } from '@/hooks/useAuth'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import {
  Button,
  Card,
  Col,
  Descriptions,
  Result,
  Row,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography
} from 'antd'
import { EditOutlined, ShoppingOutlined } from '@ant-design/icons'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export function ProductoDetalle(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { proveedores } = useProveedores()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stockPorSucursal, setStockPorSucursal] = useState<StockPorSucursalItem[]>([])
  const [cargandoStock, setCargandoStock] = useState(false)
  const [errorStock, setErrorStock] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    productosService
      .obtener(id)
      .then(setProducto)
      .catch(() => setError('No se pudo cargar el producto'))
      .finally(() => setCargando(false))
  }, [id])

  useEffect(() => {
    // Este desglose vive en la API (es la única que conoce el stock de las demás
    // sucursales) y solo tiene sentido para un ADMIN, que es quien puede ver todas.
    if (!id || usuario?.rol !== 'ADMIN') return

    setCargandoStock(true)
    productosService
      .obtenerStockPorSucursal(id)
      .then(setStockPorSucursal)
      .catch(() => setErrorStock('No se pudo cargar el stock por sucursal'))
      .finally(() => setCargandoStock(false))
  }, [id, usuario?.rol])

  if (cargando) {
    return (
      <section>
        <VolverDashboard />
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      </section>
    )
  }

  if (error || !producto) {
    return (
      <section>
        <VolverDashboard />
        <Result
          status="warning"
          title={error ?? 'Producto no encontrado'}
          extra={
            <Button type="primary" onClick={() => navigate('/productos')}>
              Volver a Productos
            </Button>
          }
        />
      </section>
    )
  }

  const proveedor = proveedores.find((p) => p.id === producto.proveedorId)
  const stockBajo = producto.stock <= producto.stockMinimo

  return (
    <section>
      <VolverDashboard />
      <Card>
        <Row gutter={24}>
          <Col xs={24} md={8}>
            {producto.imagenUrl ? (
              <img
                src={producto.imagenUrl}
                alt={producto.nombre}
                className="w-full rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-lg bg-[var(--color-bg)] text-5xl text-gray-300">
                <ShoppingOutlined />
              </div>
            )}
          </Col>

          <Col xs={24} md={16}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <Typography.Title level={3} className="!mb-1">
                  {producto.nombre}
                </Typography.Title>
                <Typography.Text type="secondary">SKU: {producto.sku}</Typography.Text>
              </div>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/productos/${producto.id}/editar`)}
              >
                Editar
              </Button>
            </div>

            {producto.descripcion && (
              <Typography.Paragraph>{producto.descripcion}</Typography.Paragraph>
            )}

            <Row gutter={16} className="mb-4">
              <Col span={12}>
                <Statistic title="Precio" value={producto.precio} prefix="$" />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Stock"
                  value={producto.stock}
                  valueStyle={stockBajo ? { color: '#dc2626' } : undefined}
                  suffix={
                    stockBajo ? (
                      <Tag color="red" className="ml-2 align-middle">
                        Stock bajo
                      </Tag>
                    ) : undefined
                  }
                />
              </Col>
            </Row>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Proveedor">{proveedor?.nombre ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Stock mínimo">{producto.stockMinimo}</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {usuario?.rol === 'ADMIN' && (
        <Card title="Stock por sucursal" className="mt-4">
          <ErrorAlert mensaje={errorStock} />
          <Table
            rowKey="sucursalId"
            size="small"
            loading={cargandoStock}
            pagination={false}
            dataSource={stockPorSucursal}
            columns={[
              { title: 'Sucursal', dataIndex: 'sucursalNombre' },
              { title: 'Stock', dataIndex: 'stock' },
              { title: 'Stock mínimo', dataIndex: 'stockMinimo' }
            ]}
          />
        </Card>
      )}
    </section>
  )
}
