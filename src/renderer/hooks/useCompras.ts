import { useEffect, useState } from 'react'
import type { OrdenCompra } from '@shared/types'
import { comprasService } from '@/services/compras.service'

interface UseComprasResult {
  compras: OrdenCompra[]
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useCompras(): UseComprasResult {
  const [compras, setCompras] = useState<OrdenCompra[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelado = false
    setCargando(true)

    comprasService
      .listar()
      .then((data) => {
        if (!cancelado) setCompras(data)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar las compras')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [version])

  return { compras, cargando, error, recargar: () => setVersion((v) => v + 1) }
}
