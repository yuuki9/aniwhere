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

test('homeViewModel exports home CTA and work preview builders', () => {
  assert.deepEqual(
    Object.keys(homeViewModel).sort(),
    ['buildHomeCtaCards', 'buildHomeWorkPreviewItems'],
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
      ['가까운 매장', '지도에서 보기'],
      ['찜 많은 매장', '먼저 둘러보기'],
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
  assert.match(source, /HomeCtaBannerList/)
  assert.match(source, /home-cta-banner/)
  assert.doesNotMatch(source, /id="home-cta-title"/)
  assert.match(source, /home-work-poster-card/)
  assert.match(source, /home-review-preview-section/)
  assert.match(source, /매장별 리뷰로 정리 중이에요/)
  assert.doesNotMatch(source, /getPosts/)
  assert.doesNotMatch(source, /buildHomeReviewPreviewItems/)
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

test('HomePage imports CTA banner images and routes only the map CTA for now', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(source, /homeCtaNearbyBannerImage/)
  assert.match(source, /homeCtaFavoritesBannerImage/)
  assert.match(source, /homeCtaReviewsBannerImage/)
  assert.match(source, /const ctaCards = useMemo\(\(\) => buildHomeCtaCards\(\), \[\]\)/)
  assert.match(source, /card\.enabled && card\.href/)
  assert.match(source, /to=\{card\.href\}/)
  assert.doesNotMatch(source, /canUseAdminPreview/)
  assert.doesNotMatch(source, /isAdminUnlocked/)
  assert.match(styles, /\.home-cta-banner-list/)
  assert.match(styles, /\.home-cta-banner-disabled/)
})

test('HomePage shows the admin entry only for server admin roles', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const authSession = fs.readFileSync(new URL('../src/shared/lib/authSession.ts', import.meta.url), 'utf8')
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(source, /import \{ isAdminRole, readAuthSession \} from '..\/shared\/lib\/authSession'/)
  assert.match(source, /function HomeAdminEntry\(\)/)
  assert.match(source, /className="home-admin-entry-card"/)
  assert.match(source, /to="\/admin"/)
  assert.match(source, /const canEnterAdmin = useMemo\(\(\) => isAdminRole\(readAuthSession\(\)\?\.role\), \[\]\)/)
  assert.match(source, /\{canEnterAdmin \? <HomeAdminEntry \/> : null\}/)
  assert.match(authSession, /export function isAdminRole/)
  assert.match(authSession, /normalized === 'ADMIN'/)
  assert.match(authSession, /normalized === 'ROLE_ADMIN'/)
  assert.match(authSession, /normalized\?\.endsWith\('_ADMIN'\)/)
  assert.match(styles, /\.home-admin-entry-section/)
  assert.match(styles, /\.home-admin-entry-card\s*\{[\s\S]*min-height: 64px;/)
  assert.match(styles, /\.home-admin-entry-card\s*\{[\s\S]*border: 1px solid var\(--ait-color-border\);/)
})

test('Home CTA routes render as one-column list banner items', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')
  const tokens = fs.readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8')

  assert.match(source, /className="home-cta-media"/)
  assert.match(source, /className="home-cta-image"/)
  assert.match(source, /card\.headlineLines\.map/)
  assert.doesNotMatch(source, /<small>\{card\.description\}<\/small>/)
  assert.match(source, /home-cta-banner/)
  assert.doesNotMatch(source, /home-cta-card/)
  assert.match(styles, /\.home-cta-section\s*\{[\s\S]*background: var\(--ait-color-gray-0\)/)
  assert.match(styles, /\.home-cta-banner-list\s*\{[\s\S]*display: grid;/)
  assert.match(styles, /\.home-cta-banner-list\s*\{[\s\S]*gap: var\(--ait-space-3\);/)
  assert.match(styles, /\.home-cta-banner\s*\{[\s\S]*min-height: 96px;/)
  assert.match(styles, /\.home-cta-banner\s*\{[\s\S]*aspect-ratio:\s*4 \/ 1/)
  assert.match(styles, /\.home-cta-section\s*\{[\s\S]*padding-top: var\(--ait-space-0\);/)
  assert.match(styles, /\.home-cta-banner\s*\{[\s\S]*border: 1px solid var\(--ait-color-border-strong\);/)
  assert.match(styles, /\.home-cta-banner\s*\{[\s\S]*outline: 1px solid var\(--ait-color-gray-150\);/)
  assert.match(styles, /\.home-cta-banner\s*\{[\s\S]*background: var\(--ait-color-gray-50\);/)
  assert.equal(cssRuleBodies(styles, '.home-cta-banner').some((rule) => /box-shadow:/.test(rule)), false)
  assert.match(styles, /\.home-cta-media\s*\{[\s\S]*position:\s*absolute/)
  assert.match(styles, /\.home-cta-media\s*\{[\s\S]*inset:\s*0/)
  assert.match(styles, /\.home-cta-media\s*\{[\s\S]*background: var\(--ait-color-gray-50\)/)
  assert.match(styles, /\.home-cta-image\s*\{[\s\S]*object-fit: cover/)
  assert.match(styles, /\.home-cta-image\s*\{[\s\S]*object-position:\s*center center;/)
  assert.equal(cssRuleBodies(styles, '.home-cta-image').some((rule) => /transform:/.test(rule)), false)
  assert.match(styles, /\.home-cta-copy\s*\{[\s\S]*position:\s*absolute/)
  assert.match(styles, /\.home-cta-copy\s*\{[\s\S]*padding: var\(--ait-space-4\);/)
  assert.ok(cssRuleBodies(styles, '.home-cta-copy').some((rule) => /background:\s*linear-gradient\(90deg/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.home-cta-copy strong').some((rule) => /font-size:\s*var\(--ait-font-size-body-lg\);/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.home-cta-copy strong').some((rule) => /line-height:\s*1\.22;/.test(rule)))
  assert.match(styles, /\.home-cta-copy-line/)
  assert.doesNotMatch(styles, /\.home-cta-card/)
  assert.doesNotMatch(styles, /\.home-cta-carousel/)
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

test('Home CTA banner assets are horizontal list banners', () => {
  const imageNames = ['home-cta-nearby-banner.png', 'home-cta-favorites-banner.png', 'home-cta-reviews-banner.png']

  for (const imageName of imageNames) {
    assert.deepEqual(readPngDimensions(new URL(`../src/assets/images/${imageName}`, import.meta.url)), {
      width: 1600,
      height: 400,
    })
  }
})
