import { type JSX, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Form, Input, Select, Typography } from 'antd'
import type { Usuario } from '@shared/types'
import { useAuth } from '@/hooks/useAuth'
import { useSucursales } from '@/hooks/useSucursales'
import { usuariosService } from '@/services/usuarios.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { CargandoSpin } from '@/components/common/CargandoSpin'

interface UsuarioFormValues {
  nombre: string
  email: string
  rol: Usuario['rol']
  password?: string
  sucursalId?: string
}

export function UsuarioForm(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const esEdicion = Boolean(id)
  const navigate = useNavigate()
  const { usuario: usuarioActual, login } = useAuth()
  const { sucursales } = useSucursales()
  const [form] = Form.useForm<UsuarioFormValues>()
  const rol = Form.useWatch('rol', form)

  const [cargando, setCargando] = useState(esEdicion)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!id) return

    usuariosService
      .obtener(id)
      .then((usuario) => {
        form.setFieldsValue({
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          sucursalId: usuario.sucursalId ?? undefined
        })
      })
      .catch(() => setError('No se pudo cargar el usuario'))
      .finally(() => setCargando(false))
  }, [id, form])

  async function handleFinish(values: UsuarioFormValues): Promise<void> {
    setError(null)
    setGuardando(true)

    try {
      if (esEdicion && id) {
        const cambios = {
          nombre: values.nombre,
          email: values.email,
          rol: values.rol,
          ...(values.password ? { password: values.password } : {}),
          ...(values.rol !== 'ADMIN' ? { sucursalId: values.sucursalId } : {})
        }
        const actualizado = await usuariosService.actualizar(id, cambios)

        if (usuarioActual?.id === id) {
          login(actualizado)
        }
      } else {
        if (!values.password) {
          setError('La contraseña es obligatoria para un usuario nuevo')
          setGuardando(false)
          return
        }
        await usuariosService.crear({
          nombre: values.nombre,
          email: values.email,
          rol: values.rol,
          password: values.password,
          ...(values.rol !== 'ADMIN' ? { sucursalId: values.sucursalId } : {})
        })
      }

      navigate('/configuracion/usuarios')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el usuario')
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
        {esEdicion ? 'Editar usuario' : 'Nuevo usuario'}
      </Typography.Title>

      <Card className="max-w-xl">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ rol: 'VENDEDOR' }}
          onFinish={handleFinish}
          disabled={guardando}
        >
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: 'El nombre es obligatorio' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Correo"
            rules={[
              { required: true, message: 'El correo es obligatorio' },
              { type: 'email', message: 'Correo inválido' }
            ]}
          >
            <Input type="email" />
          </Form.Item>

          <Form.Item name="rol" label="Rol" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'ADMIN', label: 'Administrador' },
                { value: 'VENDEDOR', label: 'Vendedor' },
                { value: 'ALMACEN', label: 'Almacén' }
              ]}
            />
          </Form.Item>

          {rol !== 'ADMIN' && (
            <Form.Item
              name="sucursalId"
              label="Sucursal"
              rules={[{ required: true, message: 'La sucursal es obligatoria' }]}
              extra="Un administrador no queda atado a ninguna sucursal."
            >
              <Select
                options={sucursales.map((sucursal) => ({
                  value: sucursal.id,
                  label: sucursal.nombre
                }))}
              />
            </Form.Item>
          )}

          <Form.Item
            name="password"
            label={esEdicion ? 'Nueva contraseña (dejar vacío para no cambiarla)' : 'Contraseña'}
          >
            <Input.Password />
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
