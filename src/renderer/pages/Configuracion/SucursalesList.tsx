import { type JSX, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { Sucursal } from '@shared/types'
import { useSucursales } from '@/hooks/useSucursales'
import { sucursalesService } from '@/services/sucursales.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export function SucursalesList(): JSX.Element {
  const { sucursales, cargando, recargar, error: errorCarga } = useSucursales()
  const [error, setError] = useState<string | null>(null)

  async function handleEliminar(id: string): Promise<void> {
    setError(null)
    try {
      await sucursalesService.eliminar(id)
      recargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la sucursal')
    }
  }

  const columnas: TableColumnsType<Sucursal> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      render: (nombre: string, sucursal) => (
        <>
          {nombre}
          {sucursal.esPrincipal && (
            <Tag color="blue" className="ml-2">
              principal
            </Tag>
          )}
        </>
      )
    },
    {
      title: 'Creada',
      dataIndex: 'creadoEn',
      render: (creadoEn: string) => new Date(creadoEn).toLocaleDateString()
    },
    {
      title: '',
      key: 'acciones',
      align: 'right',
      render: (_, sucursal) => (
        <>
          <Link to={`/configuracion/sucursales/${sucursal.id}/editar`}>
            <Button type="text" icon={<EditOutlined />} size="small">
              Editar
            </Button>
          </Link>
          <Button
            type="text"
            danger
            size="small"
            disabled={sucursal.esPrincipal}
            title={sucursal.esPrincipal ? 'La sucursal principal no se puede eliminar' : undefined}
            onClick={() => handleEliminar(sucursal.id)}
          >
            Eliminar
          </Button>
        </>
      )
    }
  ]

  return (
    <section>
      <VolverDashboard />
      <header className="mb-4 flex items-center justify-between">
        <Typography.Title level={3} className="!mb-0">
          Sucursales
        </Typography.Title>
        <Link to="/configuracion/sucursales/nueva">
          <Button type="primary" icon={<PlusOutlined />}>
            Nueva sucursal
          </Button>
        </Link>
      </header>

      <ErrorAlert mensaje={error ?? errorCarga} />

      <Table
        rowKey="id"
        loading={cargando}
        columns={columnas}
        dataSource={sucursales}
        pagination={{ pageSize: 10 }}
      />
    </section>
  )
}
