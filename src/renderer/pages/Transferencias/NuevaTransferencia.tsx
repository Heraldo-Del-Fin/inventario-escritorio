import { type JSX, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, InputNumber, Select, Typography } from 'antd'
import { useProductos } from '@/hooks/useProductos'
import { useSucursales } from '@/hooks/useSucursales'
import { productosService } from '@/services/productos.service'
import { transferenciasService } from '@/services/transferencias.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

interface TransferenciaFormValues {
  productoId: string
  sucursalOrigenId: string
  sucursalDestinoId: string
  cantidad: number
  motivo?: string
}

export function NuevaTransferencia(): JSX.Element {
  const navigate = useNavigate()
  const { productos, cargando: cargandoProductos, error: errorProductos } = useProductos()
  const { sucursales, cargando: cargandoSucursales, error: errorSucursales } = useSucursales()
  const [form] = Form.useForm<TransferenciaFormValues>()
  const productoId = Form.useWatch('productoId', form)
  const sucursalOrigenId = Form.useWatch('sucursalOrigenId', form)

  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [stockOrigen, setStockOrigen] = useState<number | null>(null)

  useEffect(() => {
    if (!productoId || !sucursalOrigenId) {
      setStockOrigen(null)
      return
    }

    let cancelado = false
    productosService
      .obtenerStockPorSucursal(productoId)
      .then((desglose) => {
        if (cancelado) return
        setStockOrigen(desglose.find((item) => item.sucursalId === sucursalOrigenId)?.stock ?? 0)
      })
      .catch(() => {
        if (!cancelado) setStockOrigen(null)
      })

    return () => {
      cancelado = true
    }
  }, [productoId, sucursalOrigenId])

  async function handleFinish(values: TransferenciaFormValues): Promise<void> {
    setError(null)
    setGuardando(true)

    try {
      await transferenciasService.crear({
        productoId: values.productoId,
        sucursalOrigenId: values.sucursalOrigenId,
        sucursalDestinoId: values.sucursalDestinoId,
        cantidad: values.cantidad,
        motivo: values.motivo || undefined
      })
      navigate('/configuracion/transferencias')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la transferencia')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section>
      <VolverDashboard />
      <Typography.Title level={3}>Nueva transferencia</Typography.Title>

      <Card className="max-w-xl">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ cantidad: 1 }}
          onFinish={handleFinish}
          disabled={guardando}
        >
          <Form.Item
            name="productoId"
            label="Producto"
            rules={[{ required: true, message: 'Elegí un producto' }]}
          >
            <Select
              loading={cargandoProductos}
              showSearch
              optionFilterProp="label"
              options={productos.map((producto) => ({
                value: producto.id,
                label: `${producto.sku} — ${producto.nombre}`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="sucursalOrigenId"
            label="Sucursal origen"
            rules={[{ required: true, message: 'Elegí la sucursal de origen' }]}
            extra={stockOrigen !== null ? `Stock disponible en origen: ${stockOrigen}` : undefined}
          >
            <Select
              loading={cargandoSucursales}
              options={sucursales.map((sucursal) => ({
                value: sucursal.id,
                label: sucursal.nombre
              }))}
            />
          </Form.Item>

          <Form.Item
            name="sucursalDestinoId"
            label="Sucursal destino"
            dependencies={['sucursalOrigenId']}
            rules={[
              { required: true, message: 'Elegí la sucursal de destino' },
              ({ getFieldValue }) => ({
                validator(_, value: string) {
                  if (!value || value !== getFieldValue('sucursalOrigenId')) {
                    return Promise.resolve()
                  }
                  return Promise.reject(
                    new Error('El destino no puede ser la misma sucursal que el origen')
                  )
                }
              })
            ]}
          >
            <Select
              loading={cargandoSucursales}
              options={sucursales.map((sucursal) => ({
                value: sucursal.id,
                label: sucursal.nombre
              }))}
            />
          </Form.Item>

          <Form.Item
            name="cantidad"
            label="Cantidad"
            rules={[
              { required: true, message: 'La cantidad es obligatoria' },
              { type: 'number', min: 1, message: 'La cantidad debe ser mayor a 0' }
            ]}
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>

          <Form.Item name="motivo" label="Motivo (opcional)">
            <Input />
          </Form.Item>

          <ErrorAlert mensaje={error ?? errorProductos ?? errorSucursales} />

          <Form.Item className="!mb-0">
            <Button type="primary" htmlType="submit" loading={guardando}>
              Transferir
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </section>
  )
}
