import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

export function VolverDashboard(): JSX.Element {
  const navigate = useNavigate()

  return (
    <Button
      type="text"
      icon={<ArrowLeftOutlined />}
      onClick={() => navigate('/')}
      className="!px-0 mb-3"
    >
      Volver al Dashboard
    </Button>
  )
}
