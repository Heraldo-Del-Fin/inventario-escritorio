import { type JSX, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Form, Input, Typography } from 'antd'
import { clientesService } from '@/services/clientes.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { CargandoSpin } from '@/components/common/CargandoSpin'

interface ClienteFormValues {
  nombre: string
  telefono?: string
  email?: string
}

export function ClienteForm(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const esEdicion = Boolean(id)
  const navigate = useNavigate()
  const [form] = Form.useForm<ClienteFormValues>()

  const [cargando, setCargando] = useState(esEdicion)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!id) return

    clientesService
      .obtener(id)
      .then((cliente) => {
        form.setFieldsValue({
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          email: cliente.email
        })
      })
      .catch(() => setError('No se pudo cargar el cliente'))
      .finally(() => setCargando(false))
  }, [id, form])

  async function handleFinish(values: ClienteFormValues): Promise<void> {
    setError(null)
    setGuardando(true)

    const datos = {
      nombre: values.nombre,
      telefono: values.telefono || undefined,
      email: values.email || undefined
    }

    try {
      if (esEdicion && id) {
        await clientesService.actualizar(id, datos)
      } else {
        await clientesService.crear(datos)
      }
      navigate('/clientes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cliente')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <section>
        <VolverDashboard />
        <CargandoSpin />
      </section>
    )
  }

  return (
    <section>
      <VolverDashboard />
      <Typography.Title level={3}>
        {esEdicion ? 'Editar cliente' : 'Nuevo cliente'}
      </Typography.Title>

      <Card className="max-w-xl">
        <Form form={form} layout="vertical" onFinish={handleFinish} disabled={guardando}>
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: 'El nombre es obligatorio' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="telefono" label="Teléfono">
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Correo"
            rules={[{ type: 'email', message: 'Correo inválido' }]}
          >
            <Input type="email" />
          </Form.Item>

          <ErrorAlert mensaje={error} />

          <Form.Item className="!mb-0">
            <Button type="primary" htmlType="submit" loading={guardando}>
              Guardar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </section>
  )
}
