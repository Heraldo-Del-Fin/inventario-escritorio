import { type JSX, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import {
  Card,
  Col,
  DatePicker,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
  type TableColumnsType
} from 'antd'
import type { Producto, Venta } from '@shared/types'
import { useProductos } from '@/hooks/useProductos'
import { useVentas } from '@/hooks/useVentas'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

const { RangePicker } = DatePicker

interface ProductoVendido {
  productoId: string
  nombre: string
  cantidad: number
  ingresos: number
}

function estaEnRango(venta: Venta, desde: Dayjs, hasta: Dayjs): boolean {
  const fecha = dayjs(venta.creadoEn)
  return !fecha.isBefore(desde) && !fecha.isAfter(hasta)
}

export function Reportes(): JSX.Element {
  const { productos, cargando: cargandoProductos, error: errorProductos } = useProductos()
  const { ventas, cargando: cargandoVentas, error: errorVentas } = useVentas()

  const [rango, setRango] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'day').startOf('day'),
    dayjs().endOf('day')
  ])

  const productosStockBajo = useMemo(
    () =>
      [...productos]
        .filter((p) => p.stock <= p.stockMinimo)
        .sort((a, b) => a.stock - a.stockMinimo - (b.stock - b.stockMinimo)),
    [productos]
  )

  const ventasEnRango = useMemo(
    () => ventas.filter((venta) => estaEnRango(venta, rango[0], rango[1])),
    [ventas, rango]
  )

  const totalFacturado = ventasEnRango.reduce((acc, venta) => acc + venta.total, 0)
  const cantidadVentas = ventasEnRango.length
  const ticketPromedio = cantidadVentas > 0 ? totalFacturado / cantidadVentas : 0

  const productosMasVendidos = useMemo(() => {
    const acumulado = new Map<string, ProductoVendido>()

    for (const venta of ventasEnRango) {
      for (const item of venta.items) {
        const producto = productos.find((p) => p.id === item.productoId)
        const actual = acumulado.get(item.productoId) ?? {
          productoId: item.productoId,
          nombre: producto?.nombre ?? item.productoId,
          cantidad: 0,
          ingresos: 0
        }
        actual.cantidad += item.cantidad
        actual.ingresos += item.cantidad * item.precioUnitario
        acumulado.set(item.productoId, actual)
      }
    }

    return [...acumulado.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 10)
  }, [ventasEnRango, productos])

  const columnasStockBajo: TableColumnsType<Producto> = [
    { title: 'Producto', dataIndex: 'nombre' },
    { title: 'SKU', dataIndex: 'sku' },
    {
      title: 'Stock',
      dataIndex: 'stock',
      render: (stock: number) => <Tag color="red">{stock}</Tag>
    },
    { title: 'Stock mínimo', dataIndex: 'stockMinimo' }
  ]

  const columnasMasVendidos: TableColumnsType<ProductoVendido> = [
    { title: 'Producto', dataIndex: 'nombre' },
    { title: 'Cantidad vendida', dataIndex: 'cantidad' },
    { title: 'Ingresos', dataIndex: 'ingresos', render: (v: number) => `$${v}` }
  ]

  return (
    <section>
      <VolverDashboard />
      <Typography.Title level={3}>Reportes</Typography.Title>

      <ErrorAlert mensaje={errorProductos ?? errorVentas} />

      <Card title="Alertas de stock bajo" className="mb-6">
        <Table
          rowKey="id"
          loading={cargandoProductos}
          columns={columnasStockBajo}
          dataSource={productosStockBajo}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: 'No hay productos con stock bajo' }}
        />
      </Card>

      <Card
        title="Resumen de ventas"
        extra={
          <RangePicker
            value={rango}
            allowClear={false}
            onChange={(valores) => {
              if (valores && valores[0] && valores[1]) {
                setRango([valores[0].startOf('day'), valores[1].endOf('day')])
              }
            }}
          />
        }
        loading={cargandoVentas}
        className="mb-6"
      >
        <Row gutter={16}>
          <Col span={8}>
            <Statistic title="Total facturado" value={totalFacturado} prefix="$" />
          </Col>
          <Col span={8}>
            <Statistic title="Cantidad de ventas" value={cantidadVentas} />
          </Col>
          <Col span={8}>
            <Statistic title="Ticket promedio" value={ticketPromedio.toFixed(2)} prefix="$" />
          </Col>
        </Row>
      </Card>

      <Card title="Productos más vendidos">
        <Table
          rowKey="productoId"
          loading={cargandoVentas}
          columns={columnasMasVendidos}
          dataSource={productosMasVendidos}
          pagination={false}
          locale={{ emptyText: 'No hay ventas en el período seleccionado' }}
        />
      </Card>
    </section>
  )
}
