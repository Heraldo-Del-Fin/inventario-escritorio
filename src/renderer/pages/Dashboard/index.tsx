import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Col, Row, Typography } from 'antd'
import {
  AppstoreOutlined,
  DatabaseOutlined,
  DollarCircleOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined
} from '@ant-design/icons'

const secciones = [
  { to: '/productos', label: 'Productos', icon: <AppstoreOutlined /> },
  { to: '/inventario', label: 'Inventario', icon: <DatabaseOutlined /> },
  { to: '/proveedores', label: 'Proveedores', icon: <ShopOutlined /> },
  { to: '/compras', label: 'Compras', icon: <ShoppingCartOutlined /> },
  { to: '/clientes', label: 'Clientes', icon: <TeamOutlined /> },
  { to: '/ventas', label: 'Ventas', icon: <DollarCircleOutlined /> }
]

export function Dashboard(): JSX.Element {
  const navigate = useNavigate()

  return (
    <section>
      <Typography.Title level={3}>Dashboard</Typography.Title>
      <Typography.Paragraph type="secondary">
        Resumen general del inventario, ventas y alertas de stock.
      </Typography.Paragraph>

      <Row gutter={[16, 16]}>
        {secciones.map((seccion) => (
          <Col key={seccion.to} xs={24} sm={12} md={8}>
            <Card hoverable onClick={() => navigate(seccion.to)} className="text-center">
              <div style={{ fontSize: 32, color: 'var(--color-primary)' }}>{seccion.icon}</div>
              <Typography.Title level={5} className="!mb-0 !mt-2">
                {seccion.label}
              </Typography.Title>
            </Card>
          </Col>
        ))}
      </Row>
    </section>
  )
}
