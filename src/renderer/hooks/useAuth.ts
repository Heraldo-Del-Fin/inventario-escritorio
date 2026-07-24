import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const usuario = useAuthStore((state) => state.usuario)
  const token = useAuthStore((state) => state.token)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)

  return { usuario, token, autenticado: Boolean(token), login, logout }
}
