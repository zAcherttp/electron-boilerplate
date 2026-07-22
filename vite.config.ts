import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePluginDoubleshot } from 'vite-plugin-doubleshot'

const rendererRoot = fileURLToPath(new URL('./src/renderer', import.meta.url))
const rendererOutput = fileURLToPath(new URL('./dist/renderer', import.meta.url))

export default defineConfig({
  root: rendererRoot,
  base: './',
  clearScreen: false,
  plugins: [
    react(),
    tailwindcss(),
    VitePluginDoubleshot({
      type: 'electron',
      main: 'dist/main/index.js',
      entry: 'src/main/index.ts',
      outDir: 'dist/main',
      external: ['electron'],
      electron: {
        preload: {
          entry: 'src/preload/index.ts',
          outDir: 'dist/preload',
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': rendererRoot,
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: rendererOutput,
    emptyOutDir: true,
  },
})
