import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const usuario = useAuthStore((state) => state.usuario)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)

  return { usuario, autenticado: usuario !== null, login, logout }
}
