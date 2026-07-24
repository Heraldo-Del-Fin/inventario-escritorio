export const backupService = {
  crear: async (): Promise<string | null> => {
    return window.api.backup.crear()
  },

  listar: async (): Promise<string[]> => {
    return window.api.backup.listar()
  },

  restaurar: async (nombre: string): Promise<void> => {
    return window.api.backup.restaurar(nombre)
  }
}
