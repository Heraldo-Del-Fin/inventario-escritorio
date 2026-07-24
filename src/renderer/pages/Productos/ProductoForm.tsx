import { type JSX, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Typography,
  Upload
} from 'antd'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { productosService } from '@/services/productos.service'
import { useProveedores } from '@/hooks/useProveedores'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { CargandoSpin } from '@/components/common/CargandoSpin'

const MAX_IMAGEN_BYTES = 2 * 1024 * 1024
const FORMATOS_IMAGEN_VALIDOS = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

function leerImagenComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(lector.result as string)
    lector.onerror = () => reject(new Error('No se pudo leer la imagen'))
    lector.readAsDataURL(archivo)
  })
}

interface ProductoFormValues {
  sku: string
  nombre: string
  descripcion?: string
  proveedorId?: string
  precio: number
  stock?: number
  stockMinimo: number
}

export function ProductoForm(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const esEdicion = Boolean(id)
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<ProductoFormValues>()
  const { proveedores, cargando: cargandoProveedores, error: errorProveedores } = useProveedores()

  const [stockActual, setStockActual] = useState(0)
  const [imagenUrl, setImagenUrl] = useState<string | undefined>(undefined)
  const [cargando, setCargando] = useState(esEdicion)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!id) return

    productosService
      .obtener(id)
      .then((producto) => {
        form.setFieldsValue({
          sku: producto.sku,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          proveedorId: producto.proveedorId,
          precio: producto.precio,
          stockMinimo: producto.stockMinimo
        })
        setStockActual(producto.stock)
        setImagenUrl(producto.imagenUrl)
      })
      .catch(() => setError('No se pudo cargar el producto'))
      .finally(() => setCargando(false))
  }, [id, form])

  useEffect(() => {
    if (esEdicion || cargandoProveedores) return
    if (form.getFieldValue('proveedorId')) return
    const general = proveedores.find((p) => p.esGeneral)
    if (general) form.setFieldValue('proveedorId', general.id)
  }, [esEdicion, cargandoProveedores, proveedores, form])

  async function handleBeforeUpload(archivo: File): Promise<boolean> {
    if (!FORMATOS_IMAGEN_VALIDOS.includes(archivo.type)) {
      message.error('La imagen debe ser PNG, JPG, WEBP o GIF')
      return false
    }
    if (archivo.size > MAX_IMAGEN_BYTES) {
      message.error('La imagen no puede pesar más de 2MB')
      return false
    }

    try {
      setImagenUrl(await leerImagenComoDataUrl(archivo))
    } catch {
      message.error('No se pudo leer la imagen')
    }
    return false
  }

  async function handleFinish(values: ProductoFormValues): Promise<void> {
    setError(null)
    setGuardando(true)

    const datos = {
      sku: values.sku,
      nombre: values.nombre,
      descripcion: values.descripcion || undefined,
      proveedorId: values.proveedorId || undefined,
      precio: values.precio,
      stockMinimo: values.stockMinimo,
      imagenUrl
    }

    try {
      if (esEdicion && id) {
        // El stock no se edita acá para no romper el historial de movimientos:
        // los cambios de stock pasan siempre por "Ajuste de inventario".
        await productosService.actualizar(id, datos)
      } else {
        await productosService.crear({ ...datos, stock: values.stock ?? 0 })
      }
      navigate('/productos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto')
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
        {esEdicion ? 'Editar producto' : 'Nuevo producto'}
      </Typography.Title>

      <Card>
        <Form form={form} layout="vertical" onFinish={handleFinish} disabled={guardando}>
          <Row gutter={24}>
            <Col xs={24} md={16}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="sku"
                    label="SKU"
                    rules={[{ required: true, message: 'El SKU es obligatorio' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="nombre"
                    label="Nombre"
                    rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="descripcion" label="Descripción">
                <Input.TextArea rows={3} />
              </Form.Item>

              <Form.Item name="proveedorId" label="Proveedor">
                <Select
                  loading={cargandoProveedores}
                  options={proveedores.map((proveedor) => ({
                    value: proveedor.id,
                    label: proveedor.esGeneral ? `${proveedor.nombre} (general)` : proveedor.nombre
                  }))}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="precio"
                    label="Precio"
                    rules={[{ required: true, message: 'El precio es obligatorio' }]}
                  >
                    <InputNumber min={0} step={0.01} addonBefore="$" className="w-full" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  {esEdicion ? (
                    <Form.Item label="Stock actual">
                      <Input value={stockActual} disabled />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      name="stock"
                      label="Stock inicial"
                      rules={[{ required: true, message: 'El stock inicial es obligatorio' }]}
                    >
                      <InputNumber min={0} className="w-full" />
                    </Form.Item>
                  )}
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="stockMinimo"
                    label="Stock mínimo"
                    rules={[{ required: true, message: 'El stock mínimo es obligatorio' }]}
                  >
                    <InputNumber min={0} className="w-full" />
                  </Form.Item>
                </Col>
              </Row>
              {esEdicion && (
                <Typography.Text type="secondary">
                  Para cambiar el stock usá &quot;Ajuste de inventario&quot;.
                </Typography.Text>
              )}
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Imagen">
                {imagenUrl ? (
                  <div>
                    <img
                      src={imagenUrl}
                      alt="Vista previa"
                      className="mb-2 h-40 w-full rounded-lg object-cover"
                    />
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setImagenUrl(undefined)}
                      block
                    >
                      Quitar imagen
                    </Button>
                  </div>
                ) : (
                  <Upload
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    showUploadList={false}
                    beforeUpload={handleBeforeUpload}
                  >
                    <Button icon={<UploadOutlined />} block>
                      Subir imagen
                    </Button>
                  </Upload>
                )}
              </Form.Item>
            </Col>
          </Row>

          <ErrorAlert mensaje={error ?? errorProveedores} />

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
