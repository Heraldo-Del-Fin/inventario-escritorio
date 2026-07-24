import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    build: {
      externalizeDeps: true,
      rollupOptions: {
        input: resolve(__dirname, 'src/main/main.ts')
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    build: {
      externalizeDeps: true,
      rollupOptions: {
        input: resolve(__dirname, 'src/main/preload.ts')
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: {
      outDir: resolve(__dirname, 'out/renderer'),
      rollupOptions: {
        input: resolve(__dirname, 'src/renderer/index.html')
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
