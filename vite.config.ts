import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets load correctly on static hosting
  build: {
    outDir: 'dist', // Default output folder
    sourcemap: false, // Optional: removes source maps for smaller build
  },
  server: {
    port: 5173, // Dev server port
    open: true, // Opens browser automatically during local dev
  },
  resolve: {
    alias: {
      '@': '/src', // Optional: alias for easier imports if you use a src folder
    },
  },
})
// redeploy trigger
