import { useEffect, useState } from 'react'
import type { Proveedor } from '@shared/types'
import { proveedoresService } from '@/services/proveedores.service'

interface UseProveedoresResult {
  proveedores: Proveedor[]
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useProveedores(): UseProveedoresResult {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelado = false
    setCargando(true)

    proveedoresService
      .listar()
      .then((data) => {
        if (!cancelado) setProveedores(data)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar los proveedores')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [version])

  return { proveedores, cargando, error, recargar: () => setVersion((v) => v + 1) }
}
