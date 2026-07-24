import type { JSX, PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function RequireAuth({ children }: PropsWithChildren): JSX.Element {
  const { autenticado } = useAuth()
  const location = useLocation()

  if (!autenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children as JSX.Element
}
