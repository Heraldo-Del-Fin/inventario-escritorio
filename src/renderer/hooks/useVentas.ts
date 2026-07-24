import { useEffect, useState } from 'react'
import type { Venta } from '@shared/types'
import { ventasService } from '@/services/ventas.service'

interface UseVentasResult {
  ventas: Venta[]
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useVentas(): UseVentasResult {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelado = false
    setCargando(true)

    ventasService
      .listar()
      .then((data) => {
        if (!cancelado) setVentas(data)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar las ventas')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [version])

  return { ventas, cargando, error, recargar: () => setVersion((v) => v + 1) }
}
