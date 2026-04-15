import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      // Don't process GLB files — they're in public/ and get copied as-is
      external: [/\.glb$/],
    },
  },
})
