import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const mainLayoutSource = () => fs.readFileSync(new URL('../src/shared/ui/MainLayout.tsx', import.meta.url), 'utf8')
const lazyRouteComponentsSource = () => fs.readFileSync(new URL('../src/app/lazyRouteComponents.tsx', import.meta.url), 'utf8')
const routerSource = () => fs.readFileSync(new URL('../src/app/router.tsx', import.meta.url), 'utf8')
const viteConfigSource = () => fs.readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')
const graniteConfigSource = () => fs.readFileSync(new URL('../granite.config.ts', import.meta.url), 'utf8')
const appSource = () => fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const appTopNavigationSource = () => fs.readFileSync(new URL('../src/shared/ui/AppTopNavigation.tsx', import.meta.url), 'utf8')
const packageSource = () => fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')
const exploreSearchCssSource = () => fs.readFileSync(new URL('../src/styles/explore-search.css', import.meta.url), 'utf8')

test('MainLayout only treats the exact explore route tree as map layout', () => {
  const source = mainLayoutSource()

  assert.match(source, /location\.pathname === '\/explore' \|\| location\.pathname\.startsWith\('\/explore\/'\)/)
  assert.doesNotMatch(source, /location\.pathname\.startsWith\('\/explore'\)/)
})

test('Vite keeps strict local ADS port but avoids CI port collisions', () => {
  const source = viteConfigSource()

  assert.match(source, /port:\s*5173/)
  assert.match(source, /strictPort:\s*process\.env\.CI !== 'true'/)
})

test('Apps in Toss dev server keeps the local loopback host until LAN sandbox setup is enabled', () => {
  const granite = graniteConfigSource()
  const vite = viteConfigSource()

  assert.match(granite, /host:\s*'localhost'/)
  assert.match(granite, /dev:\s*'vite'/)
  assert.doesNotMatch(granite, /ANIWHERE_DEV_HOST/)
  assert.doesNotMatch(granite, /networkInterfaces/)
  assert.doesNotMatch(granite, /vite --host 0\.0\.0\.0/)
  assert.match(vite, /host:\s*'127\.0\.0\.1'/)
})

test('Apps in Toss native navigation exposes the my profile accessory button outside intro', () => {
  const granite = graniteConfigSource()
  const app = appSource()

  assert.doesNotMatch(granite, /initialAccessoryButton:\s*\{/)
  assert.match(app, /import \{ partner, tdsEvent \} from '@apps-in-toss\/web-framework'/)
  assert.match(app, /MY_PROFILE_ACCESSORY_BUTTON_ID = 'profile-magnifier'/)
  assert.match(app, /name: 'icon-profile-magnifier-mono'/)
  assert.match(app, /partner\.addAccessoryButton\(MY_PROFILE_ACCESSORY_BUTTON\)/)
  assert.match(app, /partner\.removeAccessoryButton\(\)/)
  assert.match(app, /PROFILE_ACCESSORY_BLOCKED_PATHS/)
  assert.match(app, /new Set\(\['\/', '\/intro'\]\)/)
  assert.match(app, /router\.subscribe/)
  assert.match(app, /tdsEvent\.addEventListener\('navigationAccessoryEvent'/)
  assert.match(app, /if \(id === MY_PROFILE_ACCESSORY_BUTTON_ID\)/)
  assert.match(app, /router\.navigate\('\/my'\)/)
})
test('local app navigation mirrors the native my profile accessory entry', () => {
  const source = appTopNavigationSource()
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(source, /function ProfileIcon\(\)/)
  assert.match(source, /aria-current=\{isProfileEntryCurrent \? 'page' : undefined\}/)
  assert.match(source, /aria-label=\{isProfileEntryCurrent \? '현재 내 정보' : '내 정보'\}/)
  assert.match(source, /navigate\('\/my'\)/)
  assert.match(source, /ait-navigation-profile-button/)
  assert.match(source, /location\.pathname === '\/my'/)
  assert.match(styles, /\.ait-navigation-profile-icon path\s*\{[\s\S]*stroke:\s*currentcolor;/)
})

test('Vite exposes an opt-in public bundle analyzer report', () => {
  const source = viteConfigSource()
  const packageJson = packageSource()

  assert.match(packageJson, /"analyze:bundle":\s*"vite build --mode analyze --outDir dist-analyze"/)
  assert.match(packageJson, /"rollup-plugin-visualizer"/)
  assert.match(source, /mode === 'analyze'/)
  assert.match(source, /from 'rollup-plugin-visualizer'/)
  assert.match(source, /filename:\s*'dist-analyze\/bundle-stats\.html'/)
  assert.match(source, /appRuntime = mode === 'public' \|\| mode === 'analyze' \? 'public'/)
})

test('Vite isolates Apps in Toss TDS runtime from the app entry chunk', () => {
  const source = viteConfigSource()

  assert.match(source, /chunkSizeWarningLimit:\s*appRuntime === 'apps-in-toss' \? 1200 : 500/)
  assert.match(source, /name:\s*'tds-mobile'/)
  assert.match(source, /@toss\[\\\\\/\]tds-mobile/)
  assert.match(source, /name:\s*'react-vendor'/)
})

test('Route pages are lazy loaded instead of statically imported into the entry chunk', () => {
  const router = routerSource()
  const lazyRoutes = lazyRouteComponentsSource()

  assert.match(router, /import \{ Suspense, type ReactNode \} from 'react'/)
  assert.match(router, /from '\.\/lazyRouteComponents'/)
  assert.match(lazyRoutes, /import \{ lazy \} from 'react'/)
  assert.match(lazyRoutes, /export const ExplorePage = lazy\(\(\) => import\('\.\.\/pages\/ExplorePage'\)/)
  assert.match(lazyRoutes, /export const AdminShopsPage = lazy\(\(\) =>\s*import\('\.\.\/pages\/admin\/AdminShopsPage'\)/)
  assert.doesNotMatch(router, /import \{ ExplorePage \} from '\.\.\/pages\/ExplorePage'/)
  assert.doesNotMatch(router, /import \{ AdminShopsPage \} from '\.\.\/pages\/admin\/AdminShopsPage'/)
})

test('Explore local navigation offset keeps calc operators on one declaration line', () => {
  const styles = exploreSearchCssSource()

  assert.match(
    styles,
    /padding-top:\s*calc\(max\(var\(--ait-space-4\), calc\(env\(safe-area-inset-top\) \+ var\(--ait-space-2\)\)\) \+ var\(--ait-component-navigation-height\) \+ var\(--ait-space-5\)\);/,
  )
})
