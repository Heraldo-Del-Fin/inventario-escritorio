import { type JSX, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, InputNumber, Select, Table, Typography, type TableColumnsType } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { ItemCompra } from '@shared/types'
import { useProductos } from '@/hooks/useProductos'
import { useProveedores } from '@/hooks/useProveedores'
import { useAuthStore } from '@/store/auth.store'
import { comprasService } from '@/services/compras.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export function NuevaCompra(): JSX.Element {
  const navigate = useNavigate()
  const { productos, cargando: cargandoProductos, error: errorProductos } = useProductos()
  const { proveedores, cargando: cargandoProveedores, error: errorProveedores } = useProveedores()
  const usuario = useAuthStore((state) => state.usuario)

  const [proveedorId, setProveedorId] = useState<string | undefined>(undefined)
  const [productoId, setProductoId] = useState<string | undefined>(undefined)
  const [cantidad, setCantidad] = useState(1)
  const [items, setItems] = useState<ItemCompra[]>([])
  const [error, setError] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    if (proveedorId || cargandoProveedores) return
    const general = proveedores.find((p) => p.esGeneral)
    if (general) setProveedorId(general.id)
  }, [proveedorId, cargandoProveedores, proveedores])

  function handleAgregar(): void {
    if (!productoId || cantidad <= 0) return

    setItems((actuales) => {
      const existente = actuales.find((item) => item.productoId === productoId)
      if (existente) {
        return actuales.map((item) =>
          item.productoId === productoId ? { ...item, cantidad: item.cantidad + cantidad } : item
        )
      }
      return [...actuales, { productoId, cantidad }]
    })
    setProductoId(undefined)
    setCantidad(1)
  }

  function handleQuitar(id: string): void {
    setItems((actuales) => actuales.filter((item) => item.productoId !== id))
  }

  async function handleConfirmar(): Promise<void> {
    setError(null)
    setConfirmando(true)

    try {
      await comprasService.crear({ items, proveedorId, usuarioId: usuario?.id })
      navigate('/compras')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la compra')
    } finally {
      setConfirmando(false)
    }
  }

  const columnas: TableColumnsType<ItemCompra> = [
    {
      title: 'Producto',
      dataIndex: 'productoId',
      render: (id: string) => productos.find((p) => p.id === id)?.nombre ?? id
    },
    { title: 'Cantidad', dataIndex: 'cantidad' },
    {
      title: '',
      key: 'acciones',
      align: 'right',
      render: (_, item) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleQuitar(item.productoId)}
        >
          Quitar
        </Button>
      )
    }
  ]

  return (
    <section>
      <VolverDashboard />
      <Typography.Title level={3}>Nueva compra</Typography.Title>

      <Card className="max-w-2xl">
        <div className="mb-4">
          <Typography.Text strong>Proveedor</Typography.Text>
          <Select
            className="mt-1 w-full"
            loading={cargandoProveedores}
            value={proveedorId}
            onChange={setProveedorId}
            options={proveedores.map((proveedor) => ({
              value: proveedor.id,
              label: proveedor.esGeneral ? `${proveedor.nombre} (general)` : proveedor.nombre
            }))}
          />
        </div>

        <div className="mb-4 flex gap-2">
          <Select
            className="flex-1"
            placeholder="Seleccionar producto..."
            loading={cargandoProductos}
            showSearch
            optionFilterProp="label"
            value={productoId}
            onChange={setProductoId}
            options={productos.map((producto) => ({
              value: producto.id,
              label: `${producto.sku} — ${producto.nombre} (stock: ${producto.stock})`
            }))}
          />
          <InputNumber min={1} value={cantidad} onChange={(v) => setCantidad(v ?? 1)} />
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

        <ErrorAlert mensaje={error ?? errorProductos ?? errorProveedores} />

        <Button
          type="primary"
          onClick={handleConfirmar}
          disabled={items.length === 0}
          loading={confirmando}
        >
          Confirmar compra
        </Button>
      </Card>
    </section>
  )
}
