import { type JSX, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { Usuario } from '@shared/types'
import { useAuth } from '@/hooks/useAuth'
import { useUsuarios } from '@/hooks/useUsuarios'
import { usuariosService } from '@/services/usuarios.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

const COLOR_ROL: Record<Usuario['rol'], string> = {
  ADMIN: 'blue',
  VENDEDOR: 'green',
  ALMACEN: 'orange'
}

export function UsuariosList(): JSX.Element {
  const { usuario: usuarioActual } = useAuth()
  const { usuarios, cargando, recargar, error: errorCarga } = useUsuarios()
  const [error, setError] = useState<string | null>(null)

  async function handleEliminar(id: string): Promise<void> {
    setError(null)
    try {
      await usuariosService.eliminar(id)
      recargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario')
    }
  }

  const columnas: TableColumnsType<Usuario> = [
    { title: 'Nombre', dataIndex: 'nombre' },
    { title: 'Correo', dataIndex: 'email' },
    {
      title: 'Rol',
      dataIndex: 'rol',
      render: (rol: Usuario['rol']) => <Tag color={COLOR_ROL[rol]}>{rol}</Tag>
    },
    {
      title: '',
      key: 'acciones',
      align: 'right',
      render: (_, usuario) => {
        const esUsuarioActual = usuario.id === usuarioActual?.id
        return (
          <>
            <Link to={`/configuracion/usuarios/${usuario.id}`}>
              <Button type="text" icon={<EditOutlined />} size="small">
                Editar
              </Button>
            </Link>
            <Button
              type="text"
              danger
              size="small"
              disabled={esUsuarioActual}
              title={esUsuarioActual ? 'No podés eliminar tu propio usuario' : undefined}
              onClick={() => handleEliminar(usuario.id)}
            >
              Eliminar
            </Button>
          </>
        )
      }
    }
  ]

  return (
    <section>
      <VolverDashboard />
      <header className="mb-4 flex items-center justify-between">
        <Typography.Title level={3} className="!mb-0">
          Usuarios
        </Typography.Title>
        <Link to="/configuracion/usuarios/nuevo">
          <Button type="primary" icon={<PlusOutlined />}>
            Nuevo usuario
          </Button>
        </Link>
      </header>

      <ErrorAlert mensaje={error ?? errorCarga} />

      <Table
        rowKey="id"
        loading={cargando}
        columns={columnas}
        dataSource={usuarios}
        pagination={{ pageSize: 10 }}
      />
    </section>
  )
}
