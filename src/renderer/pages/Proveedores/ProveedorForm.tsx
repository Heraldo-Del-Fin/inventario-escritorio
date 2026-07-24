import { type JSX, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Form, Input, Typography } from 'antd'
import { proveedoresService } from '@/services/proveedores.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { CargandoSpin } from '@/components/common/CargandoSpin'

interface ProveedorFormValues {
  nombre: string
  contacto?: string
  telefono?: string
  email?: string
}

export function ProveedorForm(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const esEdicion = Boolean(id)
  const navigate = useNavigate()
  const [form] = Form.useForm<ProveedorFormValues>()

  const [cargando, setCargando] = useState(esEdicion)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!id) return

    proveedoresService
      .obtener(id)
      .then((proveedor) => {
        form.setFieldsValue({
          nombre: proveedor.nombre,
          contacto: proveedor.contacto,
          telefono: proveedor.telefono,
          email: proveedor.email
        })
      })
      .catch(() => setError('No se pudo cargar el proveedor'))
      .finally(() => setCargando(false))
  }, [id, form])

  async function handleFinish(values: ProveedorFormValues): Promise<void> {
    setError(null)
    setGuardando(true)

    const datos = {
      nombre: values.nombre,
      contacto: values.contacto || undefined,
      telefono: values.telefono || undefined,
      email: values.email || undefined
    }

    try {
      if (esEdicion && id) {
        await proveedoresService.actualizar(id, datos)
      } else {
        await proveedoresService.crear(datos)
      }
      navigate('/proveedores')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el proveedor')
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
        {esEdicion ? 'Editar proveedor' : 'Nuevo proveedor'}
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

          <Form.Item name="contacto" label="Contacto">
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
