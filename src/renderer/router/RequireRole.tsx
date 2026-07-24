import type { JSX, PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import type { Usuario } from '@shared/types'
import { useAuth } from '@/hooks/useAuth'

interface RequireRoleProps {
  roles: Usuario['rol'][]
}

export function RequireRole({ roles, children }: PropsWithChildren<RequireRoleProps>): JSX.Element {
  const { usuario } = useAuth()

  if (!usuario || !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />
  }

  return children as JSX.Element
}
