import type { Credenciales, SesionAuth } from '@shared/types'

export const authService = {
  login: async (credenciales: Credenciales): Promise<SesionAuth> => {
    return window.api.auth.login(credenciales)
  }
}
