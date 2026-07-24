import type { JSX } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Col, Empty, Row, Tag, Typography } from 'antd'
import { PlusOutlined, ShoppingOutlined } from '@ant-design/icons'
import { useProductos } from '@/hooks/useProductos'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { CargandoSpin } from '@/components/common/CargandoSpin'

export function ProductosList(): JSX.Element {
  const { productos, cargando, error } = useProductos()
  const navigate = useNavigate()

  return (
    <section>
      <VolverDashboard />
      <header className="mb-4 flex items-center justify-between">
        <Typography.Title level={3} className="!mb-0">
          Productos
        </Typography.Title>
        <Link to="/productos/nuevo">
          <Button type="primary" icon={<PlusOutlined />}>
            Nuevo producto
          </Button>
        </Link>
      </header>

      <ErrorAlert mensaje={error} />

      {cargando ? (
        <CargandoSpin />
      ) : productos.length === 0 ? (
        <Empty description="Todavía no hay productos registrados." />
      ) : (
        <Row gutter={[16, 16]}>
          {productos.map((producto) => {
            const stockBajo = producto.stock <= producto.stockMinimo
            return (
              <Col key={producto.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  onClick={() => navigate(`/productos/${producto.id}`)}
                  cover={
                    producto.imagenUrl ? (
                      <img
                        src={producto.imagenUrl}
                        alt={producto.nombre}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-[var(--color-bg)] text-3xl text-gray-300">
                        <ShoppingOutlined />
                      </div>
                    )
                  }
                >
                  <Card.Meta title={producto.nombre} description={producto.sku} />
                  <div className="mt-3 flex items-center justify-between">
                    <Typography.Text strong>${producto.precio}</Typography.Text>
                    <Tag color={stockBajo ? 'red' : 'green'}>Stock: {producto.stock}</Tag>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </section>
  )
}
