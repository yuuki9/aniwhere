import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: '/' — S3 + CloudFront at domain root (aniwhere.link); use build:static for deploy.
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: process.env.CI !== 'true',
  },
})
