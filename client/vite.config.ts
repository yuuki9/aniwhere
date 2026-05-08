import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// aniwhere.link serves the Vite static build from the domain root.
export default defineConfig(({ mode }) => {
  const appRuntime = mode === 'public' ? 'public' : (process.env.APP_RUNTIME ?? 'apps-in-toss')
  const tdsRuntimeAdapter =
    appRuntime === 'public'
      ? './src/shared/ui/tdsRuntime/public.tsx'
      : './src/shared/ui/tdsRuntime/apps-in-toss.tsx'

  return {
    base: '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@aniwhere/tds-runtime': fileURLToPath(new URL(tdsRuntimeAdapter, import.meta.url)),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: process.env.CI !== 'true',
    },
  }
})
