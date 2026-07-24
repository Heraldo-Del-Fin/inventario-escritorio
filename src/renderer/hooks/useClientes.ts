import { useEffect, useState } from 'react'
import type { Cliente } from '@shared/types'
import { clientesService } from '@/services/clientes.service'

interface UseClientesResult {
  clientes: Cliente[]
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useClientes(): UseClientesResult {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelado = false
    setCargando(true)

    clientesService
      .listar()
      .then((data) => {
        if (!cancelado) setClientes(data)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar los clientes')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [version])

  return { clientes, cargando, error, recargar: () => setVersion((v) => v + 1) }
}
