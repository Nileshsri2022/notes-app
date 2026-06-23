/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy, stable vendors out of the app chunk so the main bundle
        // is smaller and the vendor chunks cache well across deploys.
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
  test: {
    testTimeout: 15000,
  },
})