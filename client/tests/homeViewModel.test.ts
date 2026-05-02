import test from 'node:test'
import assert from 'node:assert/strict'
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
