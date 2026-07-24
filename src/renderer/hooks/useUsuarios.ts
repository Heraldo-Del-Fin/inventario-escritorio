import { useEffect, useState } from 'react'
import type { Usuario } from '@shared/types'
import { usuariosService } from '@/services/usuarios.service'

interface UseUsuariosResult {
  usuarios: Usuario[]
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useUsuarios(): UseUsuariosResult {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelado = false
    setCargando(true)

    usuariosService
      .listar()
      .then((data) => {
        if (!cancelado) setUsuarios(data)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar los usuarios')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [version])

  return { usuarios, cargando, error, recargar: () => setVersion((v) => v + 1) }
}
