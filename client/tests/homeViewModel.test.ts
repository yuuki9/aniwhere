import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as homeViewModel from '../src/pages/homeViewModel.ts'

test('homeViewModel exports home CTA, work preview, and review preview builders', () => {
  assert.deepEqual(
    Object.keys(homeViewModel).sort(),
    ['buildHomeCtaCards', 'buildHomeReviewPreviewItems', 'buildHomeWorkPreviewItems'],
  )
})

test('buildHomeCtaCards keeps the map CTA active and future sort CTAs disabled', () => {
  const cards = homeViewModel.buildHomeCtaCards()

  assert.deepEqual(
    cards.map((card) => card.id),
    ['map', 'favorites', 'reviews'],
  )
  assert.deepEqual(
    cards.map((card) => card.enabled),
    [true, false, false],
  )
  assert.equal(cards[0].href, '/explore?view=map')
  assert.equal(cards[1].href, null)
  assert.equal(cards[2].href, null)
  assert.equal(cards.some((card) => card.href?.startsWith('/search')), false)
})

test('HomePage uses user-facing sections without live region attributes', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')

  assert.match(source, /home-pending-card/)
  assert.doesNotMatch(source, /AitTop/)
  assert.match(source, /HomeSearchEntry/)
  assert.match(source, /HomeCtaCarousel/)
  assert.match(source, /home-cta-card/)
  assert.match(source, /home-work-poster-card/)
  assert.match(source, /home-review-preview-section/)
  assert.doesNotMatch(source, /HomeQuickMenuSection/)
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

test('HomePage imports CTA images and routes only the map CTA for now', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(source, /homeCtaMapImage/)
  assert.match(source, /homeCtaFavoritesImage/)
  assert.match(source, /homeCtaReviewsImage/)
  assert.match(source, /const ctaCards = useMemo\(\(\) => buildHomeCtaCards\(\), \[\]\)/)
  assert.match(source, /card\.enabled && card\.href/)
  assert.match(source, /to=\{card\.href\}/)
  assert.doesNotMatch(source, /canUseAdminPreview/)
  assert.doesNotMatch(source, /isAdminUnlocked/)
  assert.match(styles, /\.home-cta-carousel/)
  assert.match(styles, /\.home-cta-card-disabled/)
})
