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
    ['stores', 'reviews', 'admin'],
  )
  assert.equal(menus[0].href, '/explore')
  assert.equal(menus[2].href, '/admin/shops')
  assert.deepEqual(
    menus.map((menu) => menu.label),
    ['매장 찾기', '방문 후기', '매장 관리'],
  )
  assert.equal(menus.some((menu) => menu.href.startsWith('/search')), false)
})

test('HomePage uses static user-facing pending cards without live region attributes', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')

  assert.match(source, /home-pending-card/)
  assert.doesNotMatch(source, /AitTop/)
  assert.match(source, /HomeSearchEntry/)
  assert.match(source, /HomeQuickMenuSection/)
  assert.match(source, /작품, 매장명, 지역으로 검색/)
  assert.match(source, /작품별 매장 찾기를 준비 중이에요/)
  assert.match(source, /첫 방문 후기를 기다리고 있어요/)
  assert.doesNotMatch(source, /관리자/)
  assert.doesNotMatch(source, /API/)
  assert.doesNotMatch(source, /aria-live="polite"/)
  assert.doesNotMatch(source, /role="status"/)
})
