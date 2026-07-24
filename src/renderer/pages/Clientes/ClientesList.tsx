import { type JSX, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { Cliente } from '@shared/types'
import { useClientes } from '@/hooks/useClientes'
import { clientesService } from '@/services/clientes.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export function ClientesList(): JSX.Element {
  const { clientes, cargando, recargar, error: errorCarga } = useClientes()
  const [error, setError] = useState<string | null>(null)

  async function handleEliminar(id: string): Promise<void> {
    setError(null)
    try {
      await clientesService.eliminar(id)
      recargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el cliente')
    }
  }

  const columnas: TableColumnsType<Cliente> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      render: (nombre: string, cliente) => (
        <>
          {nombre}
          {cliente.esGeneral && (
            <Tag color="blue" className="ml-2">
              general
            </Tag>
          )}
        </>
      )
    },
    { title: 'Teléfono', dataIndex: 'telefono', render: (v?: string) => v ?? '—' },
    { title: 'Correo', dataIndex: 'email', render: (v?: string) => v ?? '—' },
    {
      title: '',
      key: 'acciones',
      align: 'right',
      render: (_, cliente) => (
        <>
          <Link to={`/clientes/${cliente.id}/editar`}>
            <Button type="text" icon={<EditOutlined />} size="small">
              Editar
            </Button>
          </Link>
          <Button
            type="text"
            danger
            size="small"
            disabled={cliente.esGeneral}
            title={cliente.esGeneral ? 'El cliente general no se puede eliminar' : undefined}
            onClick={() => handleEliminar(cliente.id)}
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
          Clientes
        </Typography.Title>
        <Link to="/clientes/nuevo">
          <Button type="primary" icon={<PlusOutlined />}>
            Nuevo cliente
          </Button>
        </Link>
      </header>

      <ErrorAlert mensaje={error ?? errorCarga} />

      <Table
        rowKey="id"
        loading={cargando}
        columns={columnas}
        dataSource={clientes}
        pagination={{ pageSize: 10 }}
      />
    </section>
  )
}
