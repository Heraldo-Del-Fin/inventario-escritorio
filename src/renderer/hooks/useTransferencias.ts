import { useEffect, useState } from 'react'
import type { Transferencia } from '@shared/types'
import { transferenciasService } from '@/services/transferencias.service'

interface UseTransferenciasResult {
  transferencias: Transferencia[]
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useTransferencias(): UseTransferenciasResult {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelado = false
    setCargando(true)

    transferenciasService
      .listar()
      .then((data) => {
        if (!cancelado) setTransferencias(data)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar las transferencias')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [version])

  return { transferencias, cargando, error, recargar: () => setVersion((v) => v + 1) }
}
