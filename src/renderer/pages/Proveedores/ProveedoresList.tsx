import { type JSX, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { Proveedor } from '@shared/types'
import { useProveedores } from '@/hooks/useProveedores'
import { proveedoresService } from '@/services/proveedores.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export function ProveedoresList(): JSX.Element {
  const { proveedores, cargando, recargar, error: errorCarga } = useProveedores()
  const [error, setError] = useState<string | null>(null)

  async function handleEliminar(id: string): Promise<void> {
    setError(null)
    try {
      await proveedoresService.eliminar(id)
      recargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el proveedor')
    }
  }

  const columnas: TableColumnsType<Proveedor> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      render: (nombre: string, proveedor) => (
        <>
          {nombre}
          {proveedor.esGeneral && (
            <Tag color="blue" className="ml-2">
              general
            </Tag>
          )}
        </>
      )
    },
    { title: 'Contacto', dataIndex: 'contacto', render: (v?: string) => v ?? '—' },
    { title: 'Teléfono', dataIndex: 'telefono', render: (v?: string) => v ?? '—' },
    { title: 'Correo', dataIndex: 'email', render: (v?: string) => v ?? '—' },
    {
      title: '',
      key: 'acciones',
      align: 'right',
      render: (_, proveedor) => (
        <>
          <Link to={`/proveedores/${proveedor.id}/editar`}>
            <Button type="text" icon={<EditOutlined />} size="small">
              Editar
            </Button>
          </Link>
          <Button
            type="text"
            danger
            size="small"
            disabled={proveedor.esGeneral}
            title={proveedor.esGeneral ? 'El proveedor general no se puede eliminar' : undefined}
            onClick={() => handleEliminar(proveedor.id)}
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
          Proveedores
        </Typography.Title>
        <Link to="/proveedores/nuevo">
          <Button type="primary" icon={<PlusOutlined />}>
            Nuevo proveedor
          </Button>
        </Link>
      </header>

      <ErrorAlert mensaje={error ?? errorCarga} />

      <Table
        rowKey="id"
        loading={cargando}
        columns={columnas}
        dataSource={proveedores}
        pagination={{ pageSize: 10 }}
      />
    </section>
  )
}
