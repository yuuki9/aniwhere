import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const explorePageSource = () => fs.readFileSync(new URL('../src/pages/ExplorePage.tsx', import.meta.url), 'utf8')
const appCssSource = () =>
  [
    '../src/App.css',
    '../src/styles/explore-search.css',
    '../src/styles/admin-shop.css',
  ]
    .map((path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8'))
    .join('\n')
const shopMapSource = () => fs.readFileSync(new URL('../src/shared/ui/ShopMap.tsx', import.meta.url), 'utf8')

const cssRuleBodies = (css: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = css.matchAll(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'g'))

  return Array.from(matches, (match) => match[1])
}

test('ExplorePage shares the search bar and filter sheet pattern with SearchPage', () => {
  const source = explorePageSource()

  assert.match(source, /SearchFilterSheet/)
  assert.match(source, /className="search-screen-bar map-search-field"/)
  assert.match(source, /className="search-filter-button map-filter-button"/)
  assert.match(source, /aria-label=\{appliedFilterCount > 0 \? `필터 \$\{appliedFilterCount\}개 적용됨` : '필터 열기'\}/)
})

test('ExplorePage removes the map hamburger navigation trigger from the top search row', () => {
  const source = explorePageSource()

  assert.doesNotMatch(source, /global-nav-trigger-map/)
  assert.doesNotMatch(source, /<GlobalNavigationMenu triggerClassName="global-nav-trigger global-nav-trigger-map"/)
})

test('ExplorePage binds the filter trigger ref only to the visible top search instance', () => {
  const source = explorePageSource()

  assert.match(source, /const renderTopSearch = \(attachTriggerRef: boolean\) => \(/)
  assert.match(source, /ref=\{attachTriggerRef \? filterTriggerRef : null\}/)
  assert.match(source, /\{renderTopSearch\(!isListSheetOpen\)\}/)
  assert.match(source, /\{renderTopSearch\(isListSheetOpen\)\}/)
  assert.doesNotMatch(source, /const topSearch = \(/)
  assert.doesNotMatch(source, /ref=\{filterTriggerRef\}/)
})

test('ExplorePage exposes map viewport search after the map moves', () => {
  const source = explorePageSource()

  assert.match(source, /onViewportChange=\{handleMapViewportChange\}/)
  assert.match(source, /mapViewportFilter/)
  assert.match(source, /이 지역 매장 검색/)
})

test('Explore controls separate list, location, zoom, and AI actions for mobile reachability', () => {
  const styles = appCssSource()
  const listRules = cssRuleBodies(styles, '.map-list-fab')
  const locationRules = cssRuleBodies(styles, '.map-location-fab')
  const aiRules = cssRuleBodies(styles, '.map-llm-fab')

  assert.ok(listRules.some((rule) => /right:\s*var\(--map-control-right/.test(rule)))
  assert.ok(listRules.some((rule) => /bottom:\s*calc\(var\(--map-control-bottom/.test(rule)))
  assert.ok(listRules.some((rule) => /border-radius:\s*var\(--ait-radius-full\);/.test(rule)))
  assert.ok(locationRules.some((rule) => /right:\s*var\(--map-control-right/.test(rule)))
  assert.ok(locationRules.some((rule) => /bottom:\s*calc\(var\(--map-control-bottom/.test(rule)))
  assert.ok(aiRules.some((rule) => /bottom:\s*calc\(\s*var\(--map-control-bottom/.test(rule)))
})

test('Explore map search and filter controls stay visually separated to avoid accidental taps', () => {
  const styles = appCssSource()
  const topRowRules = cssRuleBodies(styles, '.map-search-row.search-screen-toolrow')
  const fieldRules = cssRuleBodies(styles, '.map-search-row .search-screen-bar.map-search-field')
  const filterRules = cssRuleBodies(styles, '.map-search-row .map-filter-button')

  assert.ok(topRowRules.some((rule) => /gap:\s*var\(--ait-space-4\);/.test(rule)))
  assert.ok(topRowRules.some((rule) => /background:\s*transparent;/.test(rule)))
  assert.ok(fieldRules.some((rule) => /border-radius:\s*var\(--ait-radius-full\);/.test(rule)))
  assert.ok(fieldRules.some((rule) => /background:\s*rgba\(255,\s*255,\s*255,\s*0\.98\);/.test(rule)))
  assert.ok(filterRules.some((rule) => /width:\s*46px;/.test(rule)))
  assert.ok(filterRules.some((rule) => /border:\s*1px solid rgba\(196,\s*208,\s*224,\s*0\.96\);/.test(rule)))
  assert.ok(filterRules.some((rule) => /box-shadow:\s*0 10px 22px rgba\(15,\s*23,\s*42,\s*0\.1\);/.test(rule)))
})

test('Explore map overlay controls avoid competing raised layers', () => {
  const styles = appCssSource()
  const chipRules = cssRuleBodies(styles, '.map-chip-status')
  const areaSearchRules = cssRuleBodies(styles, '.map-area-search-button')

  assert.ok(chipRules.some((rule) => /box-shadow:\s*none;/.test(rule)))
  assert.ok(areaSearchRules.some((rule) => /background:\s*rgba\(255,\s*255,\s*255,\s*0\.96\);/.test(rule)))
  assert.ok(areaSearchRules.some((rule) => /color:\s*var\(--text-strong\);/.test(rule)))
  assert.doesNotMatch(styles, /\.map-surface-sheet-open\s+\.map-list-fab\s*\{[\s\S]*?display:\s*none;/)
})

test('Explore map chip rail only captures pointer events on actual controls', () => {
  const styles = appCssSource()
  const topRules = cssRuleBodies(styles, '.map-explore-top')
  const chipToolbarRules = cssRuleBodies(styles, '.map-chip-toolbar')
  const chipScrollRules = cssRuleBodies(styles, '.map-chip-scroll')
  const chipStatusRules = cssRuleBodies(styles, '.map-chip-status')

  assert.ok(topRules.some((rule) => /pointer-events:\s*none;/.test(rule)))
  assert.ok(chipToolbarRules.some((rule) => /align-self:\s*flex-start;/.test(rule)))
  assert.ok(chipScrollRules.some((rule) => /width:\s*fit-content;/.test(rule)))
  assert.ok(chipScrollRules.some((rule) => /flex:\s*0 1 auto;/.test(rule)))
  assert.ok(chipStatusRules.some((rule) => /pointer-events:\s*auto;/.test(rule)))
})

test('ExplorePage does not fabricate category filter chips without a facet API', () => {
  const source = explorePageSource()

  assert.doesNotMatch(source, /const categories = useMemo/)
  assert.doesNotMatch(source, /setFilter/)
  assert.doesNotMatch(source, /role="tablist"/)
  assert.doesNotMatch(source, /category && !shop\.categories\.includes/)
  assert.match(source, /mapQuickChips/)
  assert.match(source, /className=\{`map-chip-status/)
  assert.match(source, /aria-pressed=\{isMapQuickChipActive\}/)
  assert.match(source, /toggleMapQuickChip\(item\.id\)/)
  assert.doesNotMatch(source, /className=\{`map-chip-status[\s\S]{0,280}setIsFilterSheetOpen\(true\)/)
  assert.match(source, /관심매장/)
  assert.match(source, /영업중/)
  assert.doesNotMatch(source, /표시 매장 \$\{mappableShops\.length\}곳/)
})

test('Explore map buttons use consistent icon sizing and refresh affordance', () => {
  const source = explorePageSource()
  const styles = appCssSource()
  const filterIconRules = cssRuleBodies(styles, '.map-search-row .map-filter-button svg')
  const areaIconRules = cssRuleBodies(styles, '.map-area-search-icon')
  const controlIconRules = cssRuleBodies(styles, '.map-control-icon')

  assert.match(source, /className="map-area-search-icon"/)
  assert.ok(filterIconRules.some((rule) => /width:\s*22px;/.test(rule) && /height:\s*22px;/.test(rule)))
  assert.ok(areaIconRules.some((rule) => /width:\s*16px;/.test(rule) && /height:\s*16px;/.test(rule)))
  assert.ok(controlIconRules.some((rule) => /width:\s*22px;/.test(rule) && /height:\s*22px;/.test(rule)))
})

test('Explore map CSS follows style rules for changed icon and control declarations', () => {
  const styles = appCssSource()
  const searchIconRules = cssRuleBodies(styles, '.map-search-field svg')
  const areaIconRules = cssRuleBodies(styles, '.map-area-search-icon')
  const aiFabRules = cssRuleBodies(styles, '.map-llm-fab')

  assert.ok(searchIconRules.some((rule) => /stroke:\s*currentcolor;/.test(rule)))
  assert.ok(areaIconRules.some((rule) => /stroke:\s*currentcolor;/.test(rule)))
  assert.ok(aiFabRules.some((rule) => /bottom:\s*calc\(var\(--map-control-bottom, 96px\) \+ var\(--map-control-stack-height, 98px\) \+ var\(--map-control-size, 48px\) \+ \(var\(--map-control-gap, 10px\) \* 2\)\);/.test(rule)))
})

test('Explore map controls remain visible before map ready and use centered list icon', () => {
  const source = explorePageSource()
  const mapSource = shopMapSource()
  const styles = appCssSource()
  const zoomButtonRules = cssRuleBodies(styles, '.map-zoom-button')
  const zoomIconRules = cssRuleBodies(styles, '.map-zoom-icon')
  const listIconRules = cssRuleBodies(styles, '.map-list-fab-icon')
  const listControlIconRules = cssRuleBodies(styles, '.map-list-fab .map-control-icon')
  const chipIconRules = cssRuleBodies(styles, '.map-chip-status::before')

  assert.doesNotMatch(source, /&& mapReady \? \(/)
  assert.doesNotMatch(source, /<strong>\{isListSheetOpen \? '지도 보기' : '매장 목록'\}<\/strong>/)
  assert.match(mapSource, /className="map-zoom-icon"/)
  assert.match(source, /className="map-list-fab-list-icon map-control-icon"/)
  assert.ok(listIconRules.some((rule) => /align-items:\s*center;/.test(rule)))
  assert.ok(listIconRules.some((rule) => /width:\s*28px;/.test(rule) && /height:\s*28px;/.test(rule)))
  assert.ok(listControlIconRules.some((rule) => /width:\s*28px;/.test(rule) && /height:\s*28px;/.test(rule)))
  assert.ok(chipIconRules.some((rule) => /width:\s*12px;/.test(rule) && /height:\s*12px;/.test(rule)))
  assert.ok(zoomButtonRules.some((rule) => /font-size:\s*0;/.test(rule)))
  assert.ok(zoomIconRules.some((rule) => /width:\s*24px;/.test(rule) && /height:\s*24px;/.test(rule)))
})
