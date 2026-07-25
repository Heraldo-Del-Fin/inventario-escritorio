import { type JSX, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, InputNumber, Select, Table, Typography, type TableColumnsType } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { ItemVenta } from '@shared/types'
import { useProductos } from '@/hooks/useProductos'
import { useClientes } from '@/hooks/useClientes'
import { useCarritoStore } from '@/store/carrito.store'
import { ventasService } from '@/services/ventas.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export function NuevaVenta(): JSX.Element {
  const navigate = useNavigate()
  const { productos, cargando, error: errorProductos } = useProductos()
  const { clientes, cargando: cargandoClientes, error: errorClientes } = useClientes()

  const items = useCarritoStore((state) => state.items)
  const agregarItem = useCarritoStore((state) => state.agregarItem)
  const quitarItem = useCarritoStore((state) => state.quitarItem)
  const limpiar = useCarritoStore((state) => state.limpiar)
  const total = useCarritoStore((state) => state.total())

  const [productoId, setProductoId] = useState<string | undefined>(undefined)
  const [cantidad, setCantidad] = useState(1)
  const [precio, setPrecio] = useState<number | null>(null)
  const [clienteId, setClienteId] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    if (clienteId || cargandoClientes) return
    const general = clientes.find((c) => c.esGeneral)
    if (general) setClienteId(general.id)
  }, [clienteId, cargandoClientes, clientes])

  function handleSeleccionarProducto(id: string): void {
    setProductoId(id)
    const producto = productos.find((p) => p.id === id)
    setPrecio(producto?.precio ?? null)
  }

  function handleAgregar(): void {
    const producto = productos.find((p) => p.id === productoId)
    if (!producto || cantidad <= 0 || precio === null || precio < 0) return

    agregarItem({ productoId: producto.id, cantidad, precioUnitario: precio })
    setProductoId(undefined)
    setCantidad(1)
    setPrecio(null)
  }

  async function handleConfirmar(): Promise<void> {
    setError(null)
    setConfirmando(true)

    try {
      await ventasService.crear({ items, clienteId })
      limpiar()
      navigate('/ventas')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la venta')
    } finally {
      setConfirmando(false)
    }
  }

  const columnas: TableColumnsType<ItemVenta> = [
    {
      title: 'Producto',
      dataIndex: 'productoId',
      render: (id: string) => productos.find((p) => p.id === id)?.nombre ?? id
    },
    { title: 'Cantidad', dataIndex: 'cantidad' },
    {
      title: 'Precio unitario',
      dataIndex: 'precioUnitario',
      render: (precioUnitario: number, item) => {
        const producto = productos.find((p) => p.id === item.productoId)
        const conDescuento = Boolean(producto && precioUnitario < producto.precio)
        return (
          <span>
            ${precioUnitario}
            {conDescuento && (
              <Typography.Text delete type="secondary" className="ml-2">
                ${producto?.precio}
              </Typography.Text>
            )}
          </span>
        )
      }
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      render: (_, item) => `$${item.precioUnitario * item.cantidad}`
    },
    {
      title: '',
      key: 'acciones',
      align: 'right',
      render: (_, item) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => quitarItem(item.productoId)}
        >
          Quitar
        </Button>
      )
    }
  ]

  return (
    <section>
      <VolverDashboard />
      <Typography.Title level={3}>Nueva venta</Typography.Title>

      <Card className="max-w-3xl">
        <div className="mb-4">
          <Typography.Text strong>Cliente</Typography.Text>
          <Select
            className="mt-1 w-full"
            loading={cargandoClientes}
            value={clienteId}
            onChange={setClienteId}
            options={clientes.map((cliente) => ({
              value: cliente.id,
              label: cliente.esGeneral ? `${cliente.nombre} (general)` : cliente.nombre
            }))}
          />
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-2">
          <Select
            className="min-w-[240px] flex-1"
            placeholder="Seleccionar producto..."
            loading={cargando}
            showSearch
            optionFilterProp="label"
            value={productoId}
            onChange={handleSeleccionarProducto}
            options={productos.map((producto) => ({
              value: producto.id,
              label: `${producto.sku} — ${producto.nombre} (stock: ${producto.stock})`
            }))}
          />
          <div>
            <Typography.Text type="secondary" className="block text-xs">
              Cantidad
            </Typography.Text>
            <InputNumber min={1} value={cantidad} onChange={(v) => setCantidad(v ?? 1)} />
          </div>
          <div>
            <Typography.Text type="secondary" className="block text-xs">
              Precio de venta
            </Typography.Text>
            <InputNumber
              min={0}
              step={0.01}
              addonBefore="$"
              value={precio}
              onChange={setPrecio}
              disabled={!productoId}
            />
          </div>
          <Button icon={<PlusOutlined />} onClick={handleAgregar} disabled={!productoId}>
            Agregar
          </Button>
        </div>

        <Table
          rowKey="productoId"
          columns={columnas}
          dataSource={items}
          pagination={false}
          locale={{ emptyText: 'Todavía no agregaste productos' }}
          className="mb-4"
        />

        <div className="mb-4 flex justify-end">
          <Typography.Title level={4} className="!mb-0">
            Total: ${total}
          </Typography.Title>
        </div>

        <ErrorAlert mensaje={error ?? errorProductos ?? errorClientes} />

        <Button
          type="primary"
          onClick={handleConfirmar}
          disabled={items.length === 0}
          loading={confirmando}
        >
          Confirmar venta
        </Button>
      </Card>
    </section>
  )
}
