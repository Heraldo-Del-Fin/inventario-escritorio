import { useEffect, useState } from 'react'
import type { Sucursal } from '@shared/types'
import { sucursalesService } from '@/services/sucursales.service'

interface UseSucursalesResult {
  sucursales: Sucursal[]
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useSucursales(): UseSucursalesResult {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelado = false
    setCargando(true)

    sucursalesService
      .listar()
      .then((data) => {
        if (!cancelado) setSucursales(data)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar las sucursales')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [version])

  return { sucursales, cargando, error, recargar: () => setVersion((v) => v + 1) }
}
