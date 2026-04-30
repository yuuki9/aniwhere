import { defineConfig } from '@apps-in-toss/web-framework/config'

const BRAND_ICON_URL =
  'https://static.toss.im/appsintoss/29865/c231d8e8-83f4-452b-8f97-d9795f6403e8.png'

export default defineConfig({
  appName: 'aniwhere-client',
  brand: {
    displayName: '애니웨어',
    primaryColor: '#3182F6',
    icon: BRAND_ICON_URL,
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
    withBackButton: true,
    withHomeButton: true,
  },
  outdir: 'dist',
  webViewProps: {
    type: 'partner',
  },
})
