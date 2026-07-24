import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Space, Typography } from 'antd'
import { CloudSyncOutlined, TeamOutlined } from '@ant-design/icons'
import { useAuth } from '@/hooks/useAuth'
import { VolverDashboard } from '@/components/common/VolverDashboard'

export function Configuracion(): JSX.Element {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  return (
    <section>
      <VolverDashboard />
      <Typography.Title level={3}>Ajustes</Typography.Title>
      <Typography.Paragraph type="secondary">
        Preferencias de la aplicación y datos del negocio.
      </Typography.Paragraph>

      {usuario?.rol === 'ADMIN' && (
        <Card className="max-w-md">
          <Space direction="vertical" className="w-full">
            <Button
              icon={<TeamOutlined />}
              onClick={() => navigate('/configuracion/usuarios')}
              block
            >
              Gestión de usuarios
            </Button>
            <Button
              icon={<CloudSyncOutlined />}
              onClick={() => navigate('/configuracion/respaldos')}
              block
            >
              Sincronización y respaldos
            </Button>
          </Space>
        </Card>
      )}
    </section>
  )
}
