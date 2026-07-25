import { type JSX, useEffect, useState } from 'react'
import {
  App,
  Button,
  Card,
  Popconfirm,
  Statistic,
  Table,
  Tag,
  Typography,
  type TableColumnsType
} from 'antd'
import { CloudSyncOutlined, HistoryOutlined, SaveOutlined } from '@ant-design/icons'
import type { CambioPendiente, EstadoSincronizacion } from '@shared/types'
import { syncService } from '@/services/sync.service'
import { backupService } from '@/services/backup.service'
import { VolverDashboard } from '@/components/common/VolverDashboard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

function parsearFechaBackup(nombre: string): Date | null {
  const match = nombre.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/)
  if (!match) return null
  const [, fecha, hh, mm, ss, ms] = match
  return new Date(`${fecha}T${hh}:${mm}:${ss}.${ms}Z`)
}

const COLOR_ESTADO: Record<CambioPendiente['estado'], string> = {
  PENDIENTE: 'gold',
  ERROR: 'red',
  SINCRONIZADO: 'green'
}

export function Respaldos(): JSX.Element {
  const { message } = App.useApp()

  const [pendientes, setPendientes] = useState<CambioPendiente[]>([])
  const [estado, setEstado] = useState<EstadoSincronizacion | null>(null)
  const [cargandoSync, setCargandoSync] = useState(true)
  const [errorSync, setErrorSync] = useState<string | null>(null)
  const [sincronizando, setSincronizando] = useState(false)

  const [backups, setBackups] = useState<string[]>([])
  const [cargandoBackups, setCargandoBackups] = useState(true)
  const [errorBackups, setErrorBackups] = useState<string | null>(null)
  const [creandoBackup, setCreandoBackup] = useState(false)
  const [restaurando, setRestaurando] = useState<string | null>(null)

  async function cargarSync(): Promise<void> {
    setCargandoSync(true)
    try {
      const [pend, est] = await Promise.all([syncService.listarPendientes(), syncService.estado()])
      setPendientes(pend)
      setEstado(est)
      setErrorSync(null)
    } catch {
      setErrorSync('No se pudo cargar el estado de sincronización')
    } finally {
      setCargandoSync(false)
    }
  }

  async function cargarBackups(): Promise<void> {
    setCargandoBackups(true)
    try {
      setBackups(await backupService.listar())
      setErrorBackups(null)
    } catch {
      setErrorBackups('No se pudieron cargar los respaldos')
    } finally {
      setCargandoBackups(false)
    }
  }

  useEffect(() => {
    cargarSync()
    cargarBackups()
  }, [])

  async function handleSincronizar(): Promise<void> {
    setSincronizando(true)
    try {
      const resultado = await syncService.ejecutar()
      if (resultado.enviados > 0) {
        message.success(`${resultado.enviados} cambio(s) sincronizado(s)`)
      } else if (resultado.fallidos > 0) {
        message.warning(
          `${resultado.fallidos} cambio(s) no se pudieron sincronizar. Mirá "Último error" en la tabla para el detalle.`
        )
      } else {
        message.info('No había cambios pendientes')
      }
      await cargarSync()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'No se pudo sincronizar')
    } finally {
      setSincronizando(false)
    }
  }

  async function handleCrearBackup(): Promise<void> {
    setCreandoBackup(true)
    try {
      const nombre = await backupService.crear()
      if (nombre) {
        message.success('Respaldo creado')
        await cargarBackups()
      } else {
        message.info('Todavía no hay datos para respaldar')
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'No se pudo crear el respaldo')
    } finally {
      setCreandoBackup(false)
    }
  }

  async function handleRestaurar(nombre: string): Promise<void> {
    setRestaurando(nombre)
    try {
      await backupService.restaurar(nombre)
      message.success('Respaldo restaurado')
      await cargarBackups()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'No se pudo restaurar el respaldo')
    } finally {
      setRestaurando(null)
    }
  }

  const columnasPendientes: TableColumnsType<CambioPendiente> = [
    { title: 'Entidad', dataIndex: 'entidad' },
    { title: 'Operación', dataIndex: 'operacion' },
    {
      title: 'Estado',
      dataIndex: 'estado',
      render: (valor: CambioPendiente['estado']) => <Tag color={COLOR_ESTADO[valor]}>{valor}</Tag>
    },
    {
      title: 'Fecha',
      dataIndex: 'creadoEn',
      render: (v: string) => new Date(v).toLocaleString()
    },
    { title: 'Último error', dataIndex: 'ultimoError', render: (v?: string) => v ?? '—' }
  ]

  const columnasBackups: TableColumnsType<{ nombre: string }> = [
    {
      title: 'Fecha',
      dataIndex: 'nombre',
      render: (nombre: string) => parsearFechaBackup(nombre)?.toLocaleString() ?? nombre
    },
    {
      title: '',
      key: 'acciones',
      align: 'right',
      render: (_, backup) => (
        <Popconfirm
          title="¿Restaurar este respaldo?"
          description="Se reemplazan los datos actuales por los de este respaldo (se guarda antes una copia de seguridad del estado actual)."
          okText="Restaurar"
          cancelText="Cancelar"
          onConfirm={() => handleRestaurar(backup.nombre)}
        >
          <Button size="small" loading={restaurando === backup.nombre}>
            Restaurar
          </Button>
        </Popconfirm>
      )
    }
  ]

  return (
    <section>
      <VolverDashboard />
      <Typography.Title level={3}>Sincronización y respaldos</Typography.Title>

      <Card
        title="Sincronización con la API"
        extra={
          <Button icon={<CloudSyncOutlined />} onClick={handleSincronizar} loading={sincronizando}>
            Sincronizar ahora
          </Button>
        }
        loading={cargandoSync}
        className="mb-6"
      >
        <ErrorAlert mensaje={errorSync} />

        <div className="mb-4 flex gap-8">
          <Statistic title="Pendientes" value={estado?.pendientes ?? 0} />
          <Statistic title="Con error" value={estado?.conError ?? 0} />
          <Statistic title="Sincronizados" value={estado?.sincronizados ?? 0} />
        </div>

        <Table
          rowKey="id"
          size="small"
          columns={columnasPendientes}
          dataSource={pendientes}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: 'No hay cambios pendientes' }}
        />
      </Card>

      <Card
        title="Respaldos de datos"
        extra={
          <Button icon={<SaveOutlined />} onClick={handleCrearBackup} loading={creandoBackup}>
            Crear respaldo ahora
          </Button>
        }
        loading={cargandoBackups}
      >
        <ErrorAlert mensaje={errorBackups} />
        <Typography.Paragraph type="secondary">
          <HistoryOutlined className="mr-2" />
          Se crea un respaldo automático cada vez que arranca la app. Se conservan los últimos 10.
        </Typography.Paragraph>

        <Table
          rowKey="nombre"
          size="small"
          columns={columnasBackups}
          dataSource={backups.map((nombre) => ({ nombre }))}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Todavía no hay respaldos' }}
        />
      </Card>
    </section>
  )
}
