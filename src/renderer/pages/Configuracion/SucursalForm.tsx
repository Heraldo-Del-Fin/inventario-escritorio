import { type JSX, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Form, Input, Typography } from 'antd'
import { sucursalesService } from '@/services/sucursales.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { CargandoSpin } from '@/components/common/CargandoSpin'

interface SucursalFormValues {
  nombre: string
}

export function SucursalForm(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const esEdicion = Boolean(id)
  const navigate = useNavigate()
  const [form] = Form.useForm<SucursalFormValues>()

  const [cargando, setCargando] = useState(esEdicion)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!id) return

    sucursalesService
      .obtener(id)
      .then((sucursal) => {
        form.setFieldsValue({ nombre: sucursal.nombre })
      })
      .catch(() => setError('No se pudo cargar la sucursal'))
      .finally(() => setCargando(false))
  }, [id, form])

  async function handleFinish(values: SucursalFormValues): Promise<void> {
    setError(null)
    setGuardando(true)

    try {
      if (esEdicion && id) {
        await sucursalesService.actualizar(id, { nombre: values.nombre })
      } else {
        await sucursalesService.crear({ nombre: values.nombre })
      }
      navigate('/configuracion/sucursales')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la sucursal')
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
        {esEdicion ? 'Editar sucursal' : 'Nueva sucursal'}
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
