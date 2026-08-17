import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'genai-vendor': ['@google/genai'],
          'map-vendor': ['@turf/turf'],
          'socket-vendor': ['socket.io-client'],
          'i18n-vendor': ['i18next', 'react-i18next']
        }
      }
    }
  }
})
