import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as homeViewModel from '../src/pages/homeViewModel.ts'

function readPngDimensions(path: URL) {
  const buffer = fs.readFileSync(path)

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

function cssRuleBodies(css: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = css.matchAll(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'g'))

  return Array.from(matches, (match) => match[1])
}

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

test('buildHomeCtaCards uses two-line curation copy without helper descriptions', () => {
  const cards = homeViewModel.buildHomeCtaCards()

  assert.deepEqual(
    cards.map((card) => card.headlineLines),
    [
      ['가까운 매장부터', '한눈에 보기'],
      ['많이 찜한 매장', '먼저 둘러보기'],
      ['후기 많은 매장', '믿고 찾아보기'],
    ],
  )
  assert.equal(cards.some((card) => 'description' in card), false)
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

test('Home CTA cards render as poster-scaled full-image curation carousel cards', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')
  const tokens = fs.readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8')

  assert.match(source, /className="home-cta-media"/)
  assert.match(source, /className="home-cta-image"/)
  assert.match(source, /card\.headlineLines\.map/)
  assert.doesNotMatch(source, /<small>\{card\.description\}<\/small>/)
  assert.match(styles, /\.home-cta-section\s*\{[\s\S]*background: var\(--ait-color-gray-0\)/)
  assert.match(styles, /\.home-cta-section\s*\{[\s\S]*margin-bottom: var\(--ait-space-2\);/)
  assert.match(styles, /\.home-cta-carousel\s*\{[\s\S]*background: var\(--ait-color-gray-0\)/)
  assert.match(styles, /\.home-cta-carousel\s*\{[\s\S]*padding: var\(--ait-space-1\) var\(--ait-space-8\) 0 0;/)
  assert.match(styles, /\.home-cta-card\s*\{[\s\S]*flex: 0 0 240px;/)
  assert.match(styles, /\.home-cta-card\s*\{[\s\S]*aspect-ratio:\s*4 \/ 5/)
  assert.match(styles, /\.home-cta-card\s*\{[\s\S]*background: var\(--ait-color-gray-0\)/)
  assert.match(styles, /\.home-cta-card\s*\{[\s\S]*border: 0;/)
  assert.equal(cssRuleBodies(styles, '.home-cta-card').some((rule) => /box-shadow:/.test(rule)), false)
  assert.match(styles, /\.home-cta-media\s*\{[\s\S]*aspect-ratio:\s*4 \/ 5/)
  assert.match(styles, /\.home-cta-media\s*\{[\s\S]*background: var\(--ait-color-gray-0\)/)
  assert.match(styles, /\.home-cta-image\s*\{[\s\S]*object-fit: cover/)
  assert.match(styles, /\.home-cta-image\s*\{[\s\S]*transform: scale\(1\.08\);/)
  assert.match(styles, /\.home-cta-image\s*\{[\s\S]*transform-origin: center center;/)
  assert.match(styles, /\.home-cta-copy\s*\{[\s\S]*position:\s*absolute/)
  assert.match(styles, /\.home-cta-copy\s*\{[\s\S]*padding: 0 16px 20px;/)
  assert.equal(cssRuleBodies(styles, '.home-cta-copy').some((rule) => /background:/.test(rule)), false)
  assert.match(styles, /\.home-cta-copy-line/)
  assert.doesNotMatch(styles, /\.home-cta-card::after/)
  assert.doesNotMatch(tokens, /--ait-shadow|--shadow/)
})

test('Home content sections keep a compact curation rhythm', () => {
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')
  const issueRules = cssRuleBodies(styles, '.home-issue-section')
  const reviewRules = cssRuleBodies(styles, '.home-review-preview-section')
  const sectionRules = Array.from(
    styles.matchAll(/\.home-issue-section,\s*\.home-review-preview-section\s*\{([\s\S]*?)\}/g),
    (match) => match[1],
  )

  assert.ok(sectionRules.some((rule) => /padding-top:\s*var\(--ait-space-3\);/.test(rule)))
  assert.ok(issueRules.some((rule) => /gap:\s*var\(--ait-space-4\);/.test(rule)))
  assert.ok(reviewRules.some((rule) => /gap:\s*var\(--ait-space-5\);/.test(rule)))
  assert.match(styles, /\.home-work-poster-card\s*\{[\s\S]*flex: 0 0 120px;/)
  assert.match(
    styles,
    /\.home-work-poster-carousel\s*\{[\s\S]*padding: var\(--ait-space-2\) var\(--ait-space-8\) var\(--ait-space-1\) var\(--ait-space-1\);/,
  )
})

test('Home CTA image assets are vertical ChatGPT curation cards', () => {
  const imageNames = ['home-cta-map.png', 'home-cta-favorites.png', 'home-cta-reviews.png']

  for (const imageName of imageNames) {
    assert.deepEqual(readPngDimensions(new URL(`../src/assets/images/${imageName}`, import.meta.url)), {
      width: 1024,
      height: 1536,
    })
  }
})
