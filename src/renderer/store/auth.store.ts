import { create } from 'zustand'
import type { Usuario } from '@shared/types'

interface AuthState {
  usuario: Usuario | null
  token: string | null
  login: (usuario: Usuario, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  usuario: null,
  token: null,
  login: (usuario, token) => set({ usuario, token }),
  logout: () => set({ usuario: null, token: null })
}))
