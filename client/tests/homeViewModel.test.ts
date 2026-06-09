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
  const matches = css.matchAll(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'g'))

  return Array.from(matches, (match) => match[1])
}

function appCssSource() {
  return fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')
}

test('homeViewModel exports home navigation builders', () => {
  assert.deepEqual(Object.keys(homeViewModel).sort(), ['buildHomeCtaCards', 'buildRecentReviewShopHref'])
})

test('buildHomeCtaCards routes store CTA cards to their approved explore entries', () => {
  const cards = homeViewModel.buildHomeCtaCards()

  assert.deepEqual(
    cards.map((card) => card.id),
    ['map', 'favorites', 'reviews'],
  )
  assert.deepEqual(
    cards.map((card) => card.enabled),
    [true, true, true],
  )
  assert.equal(cards[0].href, '/explore?view=map')
  assert.equal(cards[1].href, '/explore?view=list&sort=FAVORITE_COUNT_DESC&entry=list&returnTo=%2Fhome')
  assert.equal(cards[2].href, '/explore?view=list&sort=REVIEW_COUNT_DESC&entry=list&returnTo=%2Fhome')
  assert.equal(cards.some((card) => card.href?.startsWith('/search')), false)
})

test('buildRecentReviewShopHref opens the explored shop detail review tab from home', () => {
  assert.equal(
    homeViewModel.buildRecentReviewShopHref(42, 7),
    '/explore?view=list&entry=list&returnTo=%2Fhome&shopId=42&sheet=expanded&tab=review&focus=review&reviewId=7',
  )
})

test('buildHomeCtaCards uses two-line curation copy without helper descriptions', () => {
  const cards = homeViewModel.buildHomeCtaCards()

  assert.equal(cards.every((card) => card.headlineLines.length === 2), true)
  assert.equal(cards.some((card) => 'description' in card), false)
})

test('HomePage does not fetch or render a region shortcut module', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')

  assert.ok(source.indexOf('<HomeSearchEntry') < source.indexOf('<HomeTrendChipRail'))
  assert.doesNotMatch(source, /getShopFacets/)
  assert.doesNotMatch(source, /FacetRegionItem/)
  assert.doesNotMatch(source, /SHOP_FACET_GC_TIME_MS/)
  assert.doesNotMatch(source, /SHOP_FACET_STALE_TIME_MS/)
  assert.doesNotMatch(source, /shopFacetQueryKey/)
  assert.doesNotMatch(source, /includeRegions/)
  assert.doesNotMatch(source, /HomeRegionShortcutSection/)
  assert.doesNotMatch(source, /homeRegions/)
  assert.doesNotMatch(source, /home-region-shortcut/)
  assert.doesNotMatch(source, /coverUrl|coverImage|bannerImage|<img className="home-region/)
  assert.doesNotMatch(source, /Ait[A-Z]/)
})

test('temporary /home1 mockup route is removed', () => {
  const router = fs.readFileSync(new URL('../src/app/router.tsx', import.meta.url), 'utf8')
  const lazyRoutes = fs.readFileSync(new URL('../src/app/lazyRouteComponents.tsx', import.meta.url), 'utf8')

  assert.doesNotMatch(router, /path: 'home1'/)
  assert.doesNotMatch(router, /HomeMockupPage/)
  assert.doesNotMatch(lazyRoutes, /HomeMockupPage/)
  assert.doesNotMatch(lazyRoutes, /HomeMockupPage\.tsx|HomeMockupPage'/)
})

test('HomePage shows an auto ranking chip rail directly under search without a trends entry', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')

  assert.match(source, /import \{ useQuery \} from '@tanstack\/react-query'/)
  assert.match(source, /import \{ getMixedEntityRankings \} from '\.\.\/shared\/api\/rankings'/)
  assert.match(source, /buildTrendPreviewItems/)
  assert.match(source, /normalizeMixedEntityRankingItem/)
  assert.match(source, /buildTrendExploreHref/)
  assert.match(source, /formatTrendKindLabel/)
  assert.match(source, /queryKey: \['rankings', 'home-search-entities', '7d', 10\]/)
  assert.match(source, /queryFn: \(\) => getMixedEntityRankings\(\{ window: '7d', limit: 10 \}\)/)
  assert.match(source, /buildTrendPreviewItems\(\(trendRankingQuery\.data\?\.items \?\? \[\]\)\.map\(normalizeMixedEntityRankingItem\), 10\)/)
  assert.match(source, /function HomeTrendChipRail/)
  assert.match(source, /className="home-trend-chip-rail"/)
  assert.match(source, /className="home-trend-chip-track"/)
  assert.match(source, /aria-hidden="true"/)
  assert.match(source, /function HomeTrendChip\(\{ item, inert = false \}/)
  assert.match(source, /if \(inert\) \{[\s\S]*?<span className="home-trend-chip" aria-hidden="true">/)
  assert.match(source, /<HomeTrendChip[\s\S]*key=\{`ghost-/)
  assert.match(source, /item=\{item\}[\s\S]*inert/)
  assert.match(source, /className="home-trend-chip-rank"/)
  assert.match(source, /className="home-trend-chip-label"/)
  assert.match(source, /className="home-trend-chip-kind"/)
  assert.match(source, /className="home-trend-toggle-button"/)
  assert.match(source, /setViewMode\('list'\)/)
  assert.match(source, /setViewMode\('rail'\)/)
  assert.match(source, /<TrendRankingPanel/)
  assert.match(source, /returnTo="\/home"/)
  assert.match(source, /to=\{buildTrendExploreHref\(item, \{ returnTo: '\/home' \}\)\}/)
  assert.match(source, /trendItems\.length > 0 \? <HomeTrendChipRail items=\{trendItems\} \/> : null/)
  assert.ok(source.indexOf('<HomeSearchEntry') < source.indexOf('<HomeTrendChipRail'))
  assert.ok(source.indexOf('<HomeTrendChipRail') < source.indexOf('<HomeCtaBannerList'))
  assert.doesNotMatch(source, /to="\/trends"/)
  assert.doesNotMatch(source, /HomeTrendSection/)
  assert.doesNotMatch(source, /trend-ranking-card/)
  assert.doesNotMatch(source, /trend-ranking-row/)
  assert.doesNotMatch(source, /trend-ranking-summary/)
  assert.doesNotMatch(source, /isLoading[\s\S]*HomeTrendChipRail/)
  assert.doesNotMatch(source, /isError[\s\S]*HomeTrendChipRail/)
  assert.doesNotMatch(source, /coverUrl|coverImage|bannerImage|<img className="home-trend/)
  assert.doesNotMatch(source, /Ait[A-Z]/)
})

test('HomePage attaches a Toss banner ad only after the CTA banner stack', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const adSource = fs.readFileSync(new URL('../src/shared/ui/TossBannerAd.tsx', import.meta.url), 'utf8')
  const adConfigSource = fs.readFileSync(new URL('../src/shared/lib/tossAds.ts', import.meta.url), 'utf8')

  assert.match(source, /import \{ TossBannerAd \} from '\.\.\/shared\/ui\/TossBannerAd'/)
  assert.match(source, /const \[homeAdVisible, setHomeAdVisible\] = useState\(false\)/)
  assert.match(source, /homeAdVisible \? 'discover-shell-ad-visible' : ''/)
  assert.match(source, /<TossBannerAd className="home-ad-banner" placement="home-bottom-cta" onVisibleChange=\{setHomeAdVisible\} \/>/)
  assert.ok(source.indexOf('<HomeCtaBannerList') < source.indexOf('<HomeRecentReviewSection'))
  assert.ok(source.indexOf('<HomeRecentReviewSection') < source.lastIndexOf('<TossBannerAd'))
  assert.match(adSource, /TossAds\.attachBanner/)
  assert.match(adConfigSource, /VITE_TOSS_AD_BANNER_GROUP_ID/)
  assert.match(adConfigSource, /VITE_TOSS_AD_USE_TEST_IDS/)
  assert.match(adConfigSource, /ait-ad-test-banner-id/)
  assert.doesNotMatch(source, /TossAds\.attachBanner/)

  const styles = appCssSource()
  assert.match(styles, /\.discover-shell-ad-visible\s*\{[\s\S]*padding-bottom:\s*max\(112px,\s*calc\(env\(safe-area-inset-bottom\) \+ 104px\)\);/)
  assert.match(styles, /\.home-ad-banner\s*\{[\s\S]*position:\s*fixed;[\s\S]*right:\s*0;[\s\S]*bottom:\s*0;[\s\S]*left:\s*0;[\s\S]*width:\s*100vw;/)
})

test('Home route does not reserve an extra viewport below route navigation', () => {
  const layoutSource = fs.readFileSync(new URL('../src/shared/ui/MainLayout.tsx', import.meta.url), 'utf8')
  const styles = appCssSource()
  const discoverShellRules = cssRuleBodies(styles, '.discover-shell')

  assert.match(layoutSource, /const isHomeRoute = location\.pathname === '\/home'/)
  assert.match(layoutSource, /isHomeRoute \? 'route-content-home' : ''/)
  assert.match(styles, /\.route-content\.route-content-home\s*\{[\s\S]*padding-bottom:\s*0;/)
  assert.equal(discoverShellRules.some((rule) => /min-height:\s*auto;/.test(rule)), true)
  assert.equal(discoverShellRules.some((rule) => /min-height:\s*100dvh;/.test(rule)), false)
})

test('HomePage renders recent reviews from the Swagger recent reviews feed only when data exists', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')

  assert.match(source, /import \{ listRecentReviews \} from '\.\.\/shared\/api\/shopReviews'/)
  assert.match(source, /queryKey: \['shop-reviews', 'recent', 5, currentUserId\]/)
  assert.match(source, /queryFn: \(\) => listRecentReviews\(\{ limit: 5 \}\)/)
  assert.match(source, /function HomeRecentReviewSection/)
  assert.match(source, /home-recent-review-section/)
  assert.match(source, /HomeRecentReviewSection currentUserId=\{currentUserId\} reviews=\{recentReviewsQuery\.data \?\? \[\]\}/)
  assert.match(source, /buildRecentReviewShopHref\(review\.shopId, review\.id\)/)
  assert.doesNotMatch(source, /readRecentViewedShops|pushRecentViewedShop|recentViewedShops|window\.localStorage|localStorage/)
})

test('Home recent reviews use compact review cards with photos', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(source, /최근에 등록된 리뷰예요/)
  assert.match(source, /className="home-recent-review-card map-place-review-item"/)
  assert.match(source, /className="home-recent-review-image map-place-review-image"/)
  assert.match(source, /className=\{\['home-recent-review-helpful', review\.likedByMe \? 'home-recent-review-helpful-active' : ''\]/)
  assert.match(styles, /\.home-recent-review-section\s*\{[\s\S]*display:\s*grid;/)
  assert.match(styles, /\.home-recent-review-rail\s*\{[\s\S]*grid-auto-flow:\s*column;/)
  assert.match(styles, /\.home-recent-review-card\s*\{[\s\S]*min-height:\s*200px;/)
  assert.match(styles, /\.home-recent-review-body\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) 94px;/)
  assert.match(styles, /\.home-recent-review-image-frame\s*\{[\s\S]*overflow:\s*hidden;/)
  assert.doesNotMatch(source, /HomeRecentViewed|home-recent-viewed|최근 둘러본/)
})

test('Home ranking chip rail uses horizontal tokenized chips', () => {
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(styles, /\.home-trend-section\s*\{[\s\S]*display:\s*grid;/)
  assert.match(styles, /\.home-trend-section\s*\{[\s\S]*margin-top:\s*calc\(var\(--ait-space-2\) \* -1\);/)
  assert.match(styles, /\.home-trend-rail-row\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/)
  assert.match(styles, /\.home-trend-chip-rail\s*\{[\s\S]*display:\s*flex;/)
  assert.match(styles, /\.home-trend-chip-rail\s*\{[\s\S]*overflow:\s*hidden;/)
  assert.match(styles, /\.home-trend-chip-track\s*\{[\s\S]*animation:\s*home-trend-chip-scroll 24s linear infinite;/)
  assert.match(styles, /@keyframes home-trend-chip-scroll/)
  assert.match(styles, /\.home-trend-chip-rail:is\(:hover, :focus-within\) \.home-trend-chip-track\s*\{[\s\S]*animation-play-state:\s*paused;/)
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.home-trend-chip-track\s*\{[\s\S]*animation:\s*none;/)
  assert.match(styles, /\.home-trend-chip\s*\{[\s\S]*flex:\s*0 0 auto;/)
  assert.match(styles, /\.home-trend-chip\s*\{[\s\S]*border:\s*1px solid var\(--ait-color-border\);/)
  assert.match(styles, /\.home-trend-chip\s*\{[\s\S]*border-radius:\s*var\(--ait-radius-full\);/)
  assert.match(styles, /\.home-trend-chip-rank\s*\{[\s\S]*font-size:\s*var\(--ait-font-size-caption\);/)
  assert.match(styles, /\.home-trend-chip-label\s*\{[\s\S]*font-size:\s*var\(--ait-font-size-body-sm\);/)
  assert.match(styles, /\.home-trend-chip-kind\s*\{[\s\S]*background:\s*var\(--ait-color-gray-100\);/)
  assert.match(styles, /\.home-trend-rank-list\s*\{[\s\S]*display:\s*grid;/)
  assert.match(styles, /\.home-trend-rank-list\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/)
  assert.match(styles, /\.home-trend-rank-row\s*\{[\s\S]*grid-template-columns:\s*22px minmax\(0, 1fr\);/)
  assert.match(styles, /\.home-trend-rank-row\s*\{[\s\S]*min-height:\s*40px;/)
  assert.doesNotMatch(styles, /\.search-trend-section/)
  assert.doesNotMatch(styles, /\.home-trend-section \.trend-ranking-row/)
})

test('HomePage recent reviews do not use profile-only review preview data', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.doesNotMatch(source, /listMyReviews/)
  assert.match(source, /RecentShopReview/)
  assert.doesNotMatch(source, /getStoredAccessToken/)
  assert.doesNotMatch(source, /myReviewsQuery/)
  assert.doesNotMatch(source, /HomeReviewPreviewSection/)
  assert.doesNotMatch(source, /HomeReviewRow/)
  assert.doesNotMatch(source, /home-review-preview/)
  assert.doesNotMatch(source, /home-review-row/)
  assert.doesNotMatch(styles, /\.home-review-preview-section/)
  assert.doesNotMatch(styles, /\.home-review-row/)
  assert.doesNotMatch(styles, /\.home-review-row-meta/)
  assert.doesNotMatch(styles, /\.home-review-card/)
})

test('HomePage keeps the shared map search entry visible with its icon', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const styles = ['../src/App.css', '../src/styles/explore-search.css']
    .map((path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8'))
    .join('\n')

  assert.match(source, /function HomeSearchEntry/)
  assert.match(source, /className="map-search-field home-search-entry"/)
  assert.match(source, /<SearchIcon \/>/)
  assert.match(styles, /\.map-search-field svg\s*\{[\s\S]*width:\s*22px;/)
  assert.match(styles, /\.map-search-field svg\s*\{[\s\S]*stroke:\s*currentcolor;/)
  assert.match(styles, /\.home-search-entry\s*\{[\s\S]*width:\s*100%;/)
})

test('HomePage imports CTA banner images and routes enabled CTA cards', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(source, /homeCtaNearbyBannerImage/)
  assert.match(source, /homeCtaFavoritesBannerImage/)
  assert.match(source, /homeCtaReviewsBannerImage/)
  assert.match(source, /const ctaCards = useMemo\(\(\) => buildHomeCtaCards\(\), \[\]\)/)
  assert.match(source, /card\.enabled && card\.href/)
  assert.match(source, /to=\{card\.href\}/)
  assert.match(styles, /\.home-cta-banner-list/)
  assert.match(styles, /\.home-cta-banner-disabled/)
})

test('HomePage shows the admin entry for server admin roles and local dev preview', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const authSession = fs.readFileSync(new URL('../src/shared/lib/authSession.ts', import.meta.url), 'utf8')
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(source, /import \{ isAdminRole, readAuthSession \} from '..\/shared\/lib\/authSession'/)
  assert.match(source, /function HomeAdminEntry\(\)/)
  assert.match(source, /className="home-admin-entry-card"/)
  assert.match(source, /to="\/admin"/)
  assert.doesNotMatch(source, /to="\/admin\/shops"/)
  assert.match(source, /const canEnterAdmin = useMemo\(\(\) => import\.meta\.env\.DEV \|\| isAdminRole\(readAuthSession\(\)\?\.role\), \[\]\)/)
  assert.match(source, /\{canEnterAdmin \? <HomeAdminEntry \/> : null\}/)
  assert.ok(source.indexOf('{canEnterAdmin ? <HomeAdminEntry /> : null}') < source.indexOf('<HomeSearchEntry'))
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
  assert.match(styles, /\.home-cta-banner\s*\{[\s\S]*border: 1px solid var\(--ait-color-border-strong\);/)
  assert.match(styles, /\.home-cta-media\s*\{[\s\S]*position:\s*absolute/)
  assert.match(styles, /\.home-cta-media\s*\{[\s\S]*inset:\s*0/)
  assert.match(styles, /\.home-cta-image\s*\{[\s\S]*object-fit: cover/)
  assert.match(styles, /\.home-cta-copy\s*\{[\s\S]*position:\s*absolute/)
  assert.match(styles, /\.home-cta-copy\s*\{[\s\S]*padding: var\(--ait-space-8\);/)
  assert.ok(cssRuleBodies(styles, '.home-cta-copy').some((rule) => /background:\s*linear-gradient\(90deg/.test(rule)))
  assert.match(styles, /\.home-cta-copy-line/)
})

test('Home content sections keep a compact curation rhythm', () => {
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(styles, /\.home-trend-section\s*\{[\s\S]*margin-top:\s*calc\(var\(--ait-space-2\) \* -1\);/)
  assert.match(styles, /\.home-cta-section\s*\{[\s\S]*gap: var\(--ait-space-3\);/)
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
