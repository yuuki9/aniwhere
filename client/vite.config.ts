import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, type PluginOption } from 'vite'

// aniwhere.link serves the Vite static build from the domain root.
export default defineConfig(({ mode }) => {
  const shouldAnalyzeBundle = mode === 'analyze' || process.env.BUNDLE_ANALYZE === 'true'
  const appRuntime = mode === 'public' || mode === 'analyze' ? 'public' : (process.env.APP_RUNTIME ?? 'apps-in-toss')
  if (appRuntime !== 'public' && appRuntime !== 'apps-in-toss') {
    throw new Error(`Invalid APP_RUNTIME: ${appRuntime}. Expected "public" or "apps-in-toss".`)
  }

  const tdsRuntimeAdapter =
    appRuntime === 'public'
      ? './src/shared/ui/tdsRuntime/public.tsx'
      : './src/shared/ui/tdsRuntime/apps-in-toss.tsx'
  const tdsMobileAdapter =
    appRuntime === 'public' ? './src/shared/ui/tdsMobile/public.tsx' : './src/shared/ui/tdsMobile/apps-in-toss.tsx'
  const plugins: PluginOption[] = [react()]

  if (shouldAnalyzeBundle) {
    plugins.push(
      visualizer({
        brotliSize: true,
        filename: 'dist-analyze/bundle-stats.html',
        gzipSize: true,
        open: false,
        template: 'treemap',
      })
    )
  }

  return {
    base: '/',
    plugins,
    resolve: {
      alias: {
        '@aniwhere/tds-runtime': fileURLToPath(new URL(tdsRuntimeAdapter, import.meta.url)),
        '@aniwhere/tds-mobile': fileURLToPath(new URL(tdsMobileAdapter, import.meta.url)),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: process.env.CI !== 'true',
    },
  }
})
