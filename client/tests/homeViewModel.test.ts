import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as homeViewModel from '../src/pages/homeViewModel.ts'

test('homeViewModel exports home menu, work preview, and review preview builders', () => {
  assert.deepEqual(
    Object.keys(homeViewModel).sort(),
    ['buildHomeQuickMenus', 'buildHomeReviewPreviewItems', 'buildHomeWorkPreviewItems'],
  )
})

test('buildHomeQuickMenus keeps search out of quick menu and shows admin only when requested', () => {
  const menus = homeViewModel.buildHomeQuickMenus()
  const adminMenus = homeViewModel.buildHomeQuickMenus({ includeAdmin: true })

  assert.deepEqual(
    menus.map((menu) => menu.id),
    ['map', 'reviews'],
  )
  assert.equal(menus[0].href, '/explore?view=map')
  assert.equal(menus.some((menu) => menu.href.startsWith('/search')), false)
  assert.deepEqual(
    adminMenus.map((menu) => menu.id),
    ['map', 'reviews', 'admin'],
  )
  assert.equal(adminMenus[2].href, '/admin/shops')
})

test('HomePage uses user-facing sections without live region attributes', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')

  assert.match(source, /home-pending-card/)
  assert.doesNotMatch(source, /AitTop/)
  assert.match(source, /HomeSearchEntry/)
  assert.match(source, /HomeQuickMenuSection/)
  assert.match(source, /home-work-poster-card/)
  assert.match(source, /home-review-preview-section/)
  assert.doesNotMatch(source, /API/)
  assert.doesNotMatch(source, /aria-live="polite"/)
  assert.doesNotMatch(source, /role="status"/)
})

test('HomePage sends work poster searches to SearchPage with work scope and return target', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')

  assert.match(source, /function buildHomeWorkSearchHref\(workName: string\)/)
  assert.match(source, /params\.set\('scope', 'work'\)/)
  assert.match(source, /params\.set\('keyword', workName\)/)
  assert.match(source, /params\.set\('returnTo', '\/home'\)/)
  assert.match(source, /to=\{buildHomeWorkSearchHref\(work\.name\)\}/)
  assert.doesNotMatch(source, /to=\{`\/explore\?workId=\$\{work\.id\}&view=list`\}/)
})

test('HomePage exposes the admin entry during local preview unlock', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')

  assert.match(source, /canUseAdminPreview/)
  assert.match(source, /includeAdmin: isAdminUnlocked\(\) \|\| canUseAdminPreview\(\)/)
})
