import { type JSX, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, InputNumber, Select, Typography } from 'antd'
import type { TipoMovimiento } from '@shared/types'
import { useProductos } from '@/hooks/useProductos'
import { inventarioService } from '@/services/inventario.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

interface AjusteFormValues {
  productoId: string
  cantidad: number
  tipo: TipoMovimiento
  motivo?: string
}

export function AjusteInventario(): JSX.Element {
  const navigate = useNavigate()
  const { productos, cargando, error: errorProductos } = useProductos()
  const [form] = Form.useForm<AjusteFormValues>()
  const tipo = Form.useWatch('tipo', form) ?? 'AJUSTE'
  const productoId = Form.useWatch('productoId', form)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const productoSeleccionado = productos.find((p) => p.id === productoId)

  async function handleFinish(values: AjusteFormValues): Promise<void> {
    setError(null)
    setGuardando(true)

    try {
      await inventarioService.registrarMovimiento({
        productoId: values.productoId,
        tipo: values.tipo,
        cantidad: values.cantidad,
        motivo: values.motivo || undefined
      })
      navigate('/inventario')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el movimiento')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section>
      <VolverDashboard />
      <Typography.Title level={3}>Ajuste de inventario</Typography.Title>

      <Card className="max-w-xl">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ tipo: 'AJUSTE', cantidad: 1 }}
          onFinish={handleFinish}
          disabled={guardando}
        >
          <Form.Item
            name="productoId"
            label="Producto"
            rules={[{ required: true, message: 'Elegí un producto' }]}
          >
            <Select
              loading={cargando}
              showSearch
              optionFilterProp="label"
              options={productos.map((producto) => ({
                value: producto.id,
                label: `${producto.sku} — ${producto.nombre} (stock: ${producto.stock})`
              }))}
            />
          </Form.Item>

          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'ENTRADA', label: 'Entrada' },
                { value: 'SALIDA', label: 'Salida' },
                { value: 'AJUSTE', label: 'Ajuste (fija el stock exacto)' }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="cantidad"
            label="Cantidad"
            dependencies={['tipo']}
            rules={[
              { required: true, message: 'La cantidad es obligatoria' },
              () => ({
                validator(_, value: number) {
                  if (value === undefined || value === null) return Promise.resolve()
                  if (tipo === 'AJUSTE') {
                    if (value < 0)
                      return Promise.reject(new Error('El stock no puede ser negativo'))
                    return Promise.resolve()
                  }
                  if (value <= 0) return Promise.reject(new Error('La cantidad debe ser mayor a 0'))
                  if (
                    tipo === 'SALIDA' &&
                    productoSeleccionado &&
                    value > productoSeleccionado.stock
                  ) {
                    return Promise.reject(
                      new Error(
                        `Stock insuficiente para "${productoSeleccionado.nombre}" (disponible: ${productoSeleccionado.stock})`
                      )
                    )
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <InputNumber min={tipo === 'AJUSTE' ? 0 : 1} className="w-full" />
          </Form.Item>

          <Form.Item name="motivo" label="Motivo (opcional)">
            <Input />
          </Form.Item>

          <ErrorAlert mensaje={error ?? errorProductos} />

          <Form.Item className="!mb-0">
            <Button type="primary" htmlType="submit" loading={guardando}>
              Registrar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </section>
  )
}
