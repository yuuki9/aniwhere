import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'aniwhere-client',
  brand: {
    displayName: 'Aniwhere',
    primaryColor: '#3182F6',
    icon: '',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [
    {
      name: 'geolocation',
      access: 'access',
    },
  ],
  navigationBar: {
    withHomeButton: true,
  },
  outdir: 'dist',
  webViewProps: {
    type: 'partner',
  },
})
