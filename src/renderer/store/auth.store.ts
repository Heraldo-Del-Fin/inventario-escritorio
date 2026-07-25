import { create } from 'zustand'
import type { Usuario } from '@shared/types'

interface AuthState {
  usuario: Usuario | null
  login: (usuario: Usuario) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  usuario: null,
  login: (usuario) => set({ usuario }),
  logout: () => set({ usuario: null })
}))
