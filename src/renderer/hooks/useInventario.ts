import { useEffect, useState } from 'react'
import type { MovimientoInventario } from '@shared/types'
import { inventarioService } from '@/services/inventario.service'

interface UseInventarioResult {
  movimientos: MovimientoInventario[]
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useInventario(): UseInventarioResult {
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelado = false
    setCargando(true)

    inventarioService
      .listarMovimientos()
      .then((data) => {
        if (!cancelado) setMovimientos(data)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar los movimientos')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [version])

  return { movimientos, cargando, error, recargar: () => setVersion((v) => v + 1) }
}
