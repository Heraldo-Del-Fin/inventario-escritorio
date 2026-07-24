import { useEffect, useState } from 'react'
import type { Producto } from '@shared/types'
import { productosService } from '@/services/productos.service'

interface UseProductosResult {
  productos: Producto[]
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useProductos(): UseProductosResult {
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelado = false
    setCargando(true)

    productosService
      .listar()
      .then((data) => {
        if (!cancelado) setProductos(data)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar los productos')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [version])

  return { productos, cargando, error, recargar: () => setVersion((v) => v + 1) }
}
