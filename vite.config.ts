import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // Set correct base path when building for GitHub Pages
  // Uses repo name from GITHUB_REPOSITORY when GITHUB_PAGES is true
  base: process.env.GITHUB_PAGES === 'true'
    ? `/${(process.env.GITHUB_REPOSITORY || '').split('/')[1] || ''}/`
    : '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    allowedHosts: ['dashboard3-0.onrender.com'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  }
})
