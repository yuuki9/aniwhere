import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as homeViewModel from '../src/pages/homeViewModel.ts'

test('homeViewModel keeps home shortcuts as the only runtime builder', () => {
  assert.deepEqual(Object.keys(homeViewModel).sort(), ['buildHomeQuickMenus'])
})

test('buildHomeQuickMenus keeps aggregate search terms out of home shortcuts', () => {
  const menus = homeViewModel.buildHomeQuickMenus()

  assert.deepEqual(
    menus.map((menu) => menu.id),
    ['stores', 'reviews', 'report'],
  )
  assert.equal(menus[0].href, '/explore')
  assert.equal(menus.some((menu) => menu.href.startsWith('/search')), false)
})

test('HomePage uses static pending cards without live region attributes', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')

  assert.match(source, /home-pending-card/)
  assert.doesNotMatch(source, /aria-live="polite"/)
  assert.doesNotMatch(source, /role="status"/)
})
