import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const mainLayoutSource = () => fs.readFileSync(new URL('../src/shared/ui/MainLayout.tsx', import.meta.url), 'utf8')
const viteConfigSource = () => fs.readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')
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

test('Explore local navigation offset keeps calc operators on one declaration line', () => {
  const styles = exploreSearchCssSource()

  assert.match(
    styles,
    /padding-top:\s*calc\(max\(var\(--ait-space-4\), calc\(env\(safe-area-inset-top\) \+ var\(--ait-space-2\)\)\) \+ var\(--ait-component-navigation-height\) \+ var\(--ait-space-5\)\);/,
  )
})
