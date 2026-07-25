import { type JSX, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, Typography } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/auth.service'
import { ErrorAlert } from '@/components/common/ErrorAlert'

interface LoginValues {
  email: string
  password: string
}

export function Login(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const destino = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'

  async function handleFinish(values: LoginValues): Promise<void> {
    setError(null)
    setEnviando(true)

    try {
      const sesion = await authService.login({
        email: values.email.trim(),
        password: values.password
      })
      login(sesion.usuario)
      navigate(destino, { replace: true })
    } catch {
      setError('Correo o contraseña incorrectos')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login-screen">
      <Card className="login-card">
        <Typography.Title level={3} className="!mb-6 text-center">
          Inventario Escritorio
        </Typography.Title>

        <Form layout="vertical" onFinish={handleFinish} autoComplete="off" disabled={enviando}>
          <Form.Item
            name="email"
            label="Correo"
            rules={[{ required: true, message: 'Completá el correo' }]}
          >
            <Input prefix={<UserOutlined />} type="email" autoFocus />
          </Form.Item>

          <Form.Item
            name="password"
            label="Contraseña"
            rules={[{ required: true, message: 'Completá la contraseña' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <ErrorAlert mensaje={error} />

          <Form.Item className="!mb-0">
            <Button type="primary" htmlType="submit" loading={enviando} block>
              Ingresar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
