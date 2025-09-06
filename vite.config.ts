import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel-friendly Vite config
export default defineConfig({
  plugins: [react()],
  base: './', // ensures assets load correctly
})
