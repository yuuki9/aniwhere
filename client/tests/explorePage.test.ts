import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const explorePageSource = () => fs.readFileSync(new URL('../src/pages/ExplorePage.tsx', import.meta.url), 'utf8')
const exploreTopSearchSource = () =>
  fs.readFileSync(new URL('../src/pages/explore/ExploreTopSearch.tsx', import.meta.url), 'utf8')
const mapQuickChipsSource = () =>
  fs.readFileSync(new URL('../src/pages/explore/MapQuickChips.tsx', import.meta.url), 'utf8')
const mapOverlayControlsSource = () =>
  fs.readFileSync(new URL('../src/pages/explore/MapOverlayControls.tsx', import.meta.url), 'utf8')
const mapAssistantPanelSource = () =>
  fs.readFileSync(new URL('../src/pages/explore/MapAssistantPanel.tsx', import.meta.url), 'utf8')
const mapResultsSheetSource = () =>
  fs.readFileSync(new URL('../src/pages/explore/MapResultsSheet.tsx', import.meta.url), 'utf8')
const mapPeekSheetSource = () =>
  fs.readFileSync(new URL('../src/pages/explore/MapPeekSheet.tsx', import.meta.url), 'utf8')
const mapDetailSummaryCardSource = () =>
  fs.readFileSync(new URL('../src/pages/explore/MapDetailSummaryCard.tsx', import.meta.url), 'utf8')
const mapDetailInfoCardSource = () =>
  fs.readFileSync(new URL('../src/pages/explore/MapDetailInfoCard.tsx', import.meta.url), 'utf8')
const mapDetailMediaSectionSource = () =>
  fs.readFileSync(new URL('../src/pages/explore/MapDetailMediaSection.tsx', import.meta.url), 'utf8')
const mapDetailSupplementSectionsSource = () =>
  fs.readFileSync(new URL('../src/pages/explore/MapDetailSupplementSections.tsx', import.meta.url), 'utf8')
const appCssSource = () =>
  [
    '../src/App.css',
    '../src/styles/explore-search.css',
    '../src/styles/admin-shop.css',
  ]
    .map((path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8'))
    .join('\n')
const adminShopCssSource = () => fs.readFileSync(new URL('../src/styles/admin-shop.css', import.meta.url), 'utf8')
const exploreSearchCssSource = () => fs.readFileSync(new URL('../src/styles/explore-search.css', import.meta.url), 'utf8')
const shopMapSource = () => fs.readFileSync(new URL('../src/shared/ui/ShopMap.tsx', import.meta.url), 'utf8')

const cssRuleBodies = (css: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = css.matchAll(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'g'))

  return Array.from(matches, (match) => match[1])
}

test('ExplorePage shares the search bar and filter sheet pattern with SearchPage', () => {
  const source = explorePageSource()
  const topSearchSource = exploreTopSearchSource()

  assert.match(source, /SearchFilterSheet/)
  assert.match(source, /<AitNavigation/)
  assert.doesNotMatch(source, /title="지도"/)
  assert.match(source, /onBack=\{handleExploreBack\}/)
  assert.doesNotMatch(topSearchSource, /map-search-home-button/)
  assert.doesNotMatch(source, /onHomeClick=/)
  assert.match(topSearchSource, /className="search-screen-bar map-search-field"/)
  assert.match(topSearchSource, /className="search-filter-button map-filter-button"/)
  assert.match(topSearchSource, /aria-label=\{appliedFilterCount > 0 \? `/)
})

test('ExplorePage passes workId route filters to the shops API', () => {
  const source = explorePageSource()

  assert.match(source, /const workId = Number\(searchParams\.get\('workId'\) \?\? ''\) \|\| undefined/)
  assert.match(source, /queryKey: \['shops', 'explore-map-source', regionId, workId\]/)
  assert.match(source, /getShops\(\{ page: 0, size: MAP_FETCH_SIZE, regionId, workId \}\)/)
})

test('ExplorePage returns home from the home carousel list route before toggling map view', () => {
  const source = explorePageSource()

  assert.match(source, /type ExploreLocationState = \{[\s\S]*returnTo\?: '\/home'/)
  assert.match(source, /const routeState = location\.state as ExploreLocationState/)
  assert.match(source, /const shouldReturnHomeFromHomeList = routeState\?\.returnTo === '\/home' && isListSheetOpen/)
  assert.match(source, /if \(shouldReturnHomeFromHomeList\) \{\s*navigate\('\/home'\)\s*return\s*\}[\s\S]*?if \(isListSheetOpen\)/)
})

test('ExplorePage removes the map hamburger navigation trigger from the top search row', () => {
  const source = explorePageSource()

  assert.doesNotMatch(source, /global-nav-trigger-map/)
  assert.doesNotMatch(source, /<GlobalNavigationMenu triggerClassName="global-nav-trigger global-nav-trigger-map"/)
})

test('ExplorePage binds the filter trigger ref only to the visible top search instance', () => {
  const source = explorePageSource()
  const topSearchSource = exploreTopSearchSource()

  assert.match(source, /<ExploreTopSearch/)
  assert.match(topSearchSource, /ref=\{attachTriggerRef \? filterTriggerRef : null\}/)
  assert.match(source, /const isExploreTopHidden = sheetMode === 'expanded' \|\| isListSheetOpen/)
  assert.match(source, /!isExploreTopHidden \? \(/)
  assert.match(source, /attachTriggerRef\s+filterTriggerRef=\{filterTriggerRef\}/)
  assert.match(source, /attachTriggerRef=\{isListSheetOpen\}/)
  assert.doesNotMatch(source, /const topSearch = \(/)
  assert.doesNotMatch(source, /ref=\{filterTriggerRef\}/)
  assert.doesNotMatch(source, /const renderTopSearch = /)
})

test('ExplorePage removes hidden top controls from interaction when detail is expanded', () => {
  const source = explorePageSource()
  const styles = appCssSource()
  const hiddenRows = cssRuleBodies(styles, '.map-explore-top-hidden .map-search-row')
  const hiddenChips = cssRuleBodies(styles, '.map-explore-top-hidden .map-chip-toolbar')
  const hiddenAreaSearch = cssRuleBodies(styles, '.map-explore-top-hidden .map-area-search-button')

  assert.match(source, /aria-hidden=\{isExploreTopHidden\}/)
  assert.match(source, /!isExploreTopHidden \? \([\s\S]*?<ExploreTopSearch/)
  assert.ok(hiddenRows.some((rule) => /pointer-events:\s*none;/.test(rule)))
  assert.ok(hiddenChips.some((rule) => /pointer-events:\s*none;/.test(rule)))
  assert.ok(hiddenAreaSearch.some((rule) => /pointer-events:\s*none;/.test(rule)))
})

test('ExplorePage extracts map quick chips and overlay controls into focused components', () => {
  const source = explorePageSource()
  const quickChipsSource = mapQuickChipsSource()
  const overlayControlsSource = mapOverlayControlsSource()

  assert.match(source, /<MapQuickChips/)
  assert.match(source, /<MapOverlayControls/)
  assert.match(quickChipsSource, /aria-pressed=\{isActive\}/)
  assert.match(quickChipsSource, /onToggle\(item\.id\)/)
  assert.match(overlayControlsSource, /map-list-fab-list-icon map-control-icon/)
  assert.match(overlayControlsSource, /map-location-target-icon map-control-icon/)
  assert.doesNotMatch(source, /const chipToolbar = \(/)
})

test('Explore location button uses a distinct target icon and transient fallback message', () => {
  const source = explorePageSource()
  const overlayControlsSource = mapOverlayControlsSource()
  const styles = appCssSource()
  const targetIconRules = cssRuleBodies(styles, '.map-location-target-icon')
  const targetIconButtonRules = cssRuleBodies(styles, '.map-location-fab .map-location-target-icon')
  const toastRules = cssRuleBodies(styles, '.map-location-error-toast')

  assert.match(overlayControlsSource, /className="map-location-target-icon map-control-icon"/)
  assert.match(overlayControlsSource, /<circle cx="12" cy="12" r="5"/)
  assert.match(source, /function getLocationErrorMessage\(error: unknown\)/)
  assert.match(source, /showLocationError\(getLocationErrorMessage\(error\)\)/)
  assert.match(source, /window\.setTimeout\(\(\) => \{[\s\S]*?setLocationError\(null\)/)
  assert.match(source, /className="map-location-error-toast"/)
  assert.doesNotMatch(source, /map-inline-error map-inline-error-overlay">\{locationError\}/)
  assert.ok(targetIconRules.some((rule) => /stroke:\s*currentcolor;/.test(rule)))
  assert.ok(targetIconButtonRules.some((rule) => /width:\s*24px;/.test(rule) && /height:\s*24px;/.test(rule)))
  assert.ok(toastRules.some((rule) => /pointer-events:\s*none;/.test(rule)))
})

test('ExplorePage extracts the assistant panel into a focused component', () => {
  const source = explorePageSource()
  const assistantPanelSource = mapAssistantPanelSource()

  assert.match(source, /<MapAssistantPanel/)
  assert.match(assistantPanelSource, /className="map-llm-panel"/)
  assert.match(assistantPanelSource, /messages\.map/)
  assert.match(assistantPanelSource, /suggestions\.map/)
  assert.doesNotMatch(source, /className="map-llm-panel"/)
  assert.doesNotMatch(source, /assistantMessages\.map/)
})

test('MapAssistantPanel announces toggle state and blocks duplicate pending submissions', () => {
  const source = mapAssistantPanelSource()

  assert.match(source, /aria-label=\{open \? 'AI 탐색 닫기' : 'AI 탐색 열기'\}/)
  assert.match(source, /const canSubmitInput = !isPending && input\.trim\(\)\.length > 0/)
  assert.match(source, /if \(isPending\) \{\s*return\s*\}/)
  assert.match(source, /disabled=\{isPending\}/)
  assert.match(source, /disabled=\{!canSubmitInput\}/)
  assert.match(source, /if \(!canSubmitInput\) \{\s*return\s*\}/)
})

test('ExplorePage extracts the list results sheet into a focused component', () => {
  const source = explorePageSource()
  const resultsSheetSource = mapResultsSheetSource()

  assert.match(source, /<MapResultsSheet/)
  assert.match(resultsSheetSource, /className="map-results-sheet-v2"/)
  assert.match(resultsSheetSource, /visibleShops\.map/)
  assert.match(resultsSheetSource, /formatRelativeUpdated/)
  assert.doesNotMatch(source, /className="map-results-sheet-v2"/)
  assert.doesNotMatch(source, /visibleShops\.map/)
})

test('ExplorePage extracts the peek bottom sheet into a focused component', () => {
  const source = explorePageSource()
  const peekSheetSource = mapPeekSheetSource()

  assert.match(source, /<MapPeekSheet/)
  assert.match(source, /id="map-place-detail"/)
  assert.match(peekSheetSource, /className=\{\[/)
  assert.match(peekSheetSource, /map-bottom-sheet-peek/)
  assert.match(peekSheetSource, /role="button"/)
  assert.match(peekSheetSource, /tabIndex=\{0\}/)
  assert.match(peekSheetSource, /aria-controls="map-place-detail"/)
  assert.match(peekSheetSource, /aria-expanded=\{false\}/)
  assert.match(peekSheetSource, /event\.key === 'Enter' \|\| event\.key === ' '/)
  assert.match(peekSheetSource, /event\.preventDefault\(\)/)
  assert.match(peekSheetSource, /onPointerDown/)
  assert.match(peekSheetSource, /onPointerUp=\{\(event\) => \{\s*event\.stopPropagation\(\)/)
  assert.match(peekSheetSource, /onClick=\{\(event\) => \{\s*event\.stopPropagation\(\)\s*onOpenDirections\(event\)/)
  assert.match(peekSheetSource, /StatusPill/)
  assert.doesNotMatch(source, /map-bottom-sheet-peek/)
})

test('ExplorePage extracts the expanded detail summary actions into a focused component', () => {
  const source = explorePageSource()
  const summarySource = mapDetailSummaryCardSource()

  assert.match(source, /<MapDetailSummaryCard/)
  assert.match(summarySource, /map-sheet-summary-card-compact/)
  assert.match(summarySource, /map-place-action-grid/)
  assert.match(summarySource, /shareFeedback/)
  assert.match(summarySource, /href="#map-place-detail">지도/)
  assert.match(summarySource, /href="#map-place-info">정보/)
  assert.doesNotMatch(source, /className="map-place-action-grid"/)
})

test('ExplorePage extracts the expanded detail info rows into a focused component', () => {
  const source = explorePageSource()
  const infoSource = mapDetailInfoCardSource()

  assert.match(source, /<MapDetailInfoCard/)
  assert.match(infoSource, /map-sheet-info-list-v3/)
  assert.match(infoSource, /MapDetailRow/)
  assert.match(infoSource, /formatRelativeUpdated/)
  assert.doesNotMatch(source, /function MapDetailRow/)
  assert.doesNotMatch(source, /className="section map-sheet-info-card/)
})

test('Explore detail media uses uploaded shop photos only instead of fabricated external placeholders', () => {
  const source = explorePageSource()
  const mediaSource = mapDetailMediaSectionSource()

  assert.match(source, /uploadedPhotos\.slice\(0, 5\)\.map/)
  assert.match(mediaSource, /detailMediaItems\.length > 0/)
  assert.doesNotMatch(source, /picsum\.photos/)
  assert.doesNotMatch(mediaSource, /picsum\.photos/)
  assert.doesNotMatch(source, /aniwhere-\$\{shop\.id\}/)
})

test('ExplorePage extracts the expanded detail media section into a focused component', () => {
  const source = explorePageSource()
  const mediaSource = mapDetailMediaSectionSource()

  assert.match(source, /<MapDetailMediaSection/)
  assert.match(source, /showTopbarControls=\{!usesTossNavigation\}/)
  assert.match(mediaSource, /map-sheet-media-grid/)
  assert.match(mediaSource, /detailMediaItems\.length > 0/)
  assert.match(mediaSource, /<strong>\+\{detailMediaItems\.length\}<\/strong>/)
  assert.match(mediaSource, /showTopbarControls \? \(/)
  assert.match(mediaSource, /GlobalNavigationMenu/)
  assert.doesNotMatch(mediaSource, /shop\.links\.length/)
  assert.doesNotMatch(mediaSource, /shop\.works\.length,\s*4/)
  assert.doesNotMatch(source, /className=\{`map-sheet-media/)
  assert.doesNotMatch(source, /map-sheet-media-grid/)
})

test('Explore detail sheet hides duplicate chrome controls in Toss navigation runtime', () => {
  const source = explorePageSource()
  const mediaSource = mapDetailMediaSectionSource()

  assert.match(source, /const usesTossNavigation = useMemo\(\(\) => isAppsInTossRuntime\(\), \[\]\)/)
  assert.match(source, /!usesTossNavigation \? \(/)
  assert.match(source, /showTopbarControls=\{!usesTossNavigation\}/)
  assert.match(mediaSource, /showTopbarControls: boolean/)
  assert.match(mediaSource, /\{showTopbarControls \? \(/)
  assert.match(mediaSource, /aria-label="뒤로 가기"/)
  assert.match(mediaSource, /aria-label="상세 화면 닫기"/)
})

test('Explore detail selection pushes history so native back closes the sheet first', () => {
  const source = explorePageSource()

  assert.match(source, /const replaceSearchParams = \(next: URLSearchParams\) => \{\s*setSearchParams\(next, \{ replace: true \}\)/)
  assert.match(source, /const pushSearchParams = \(next: URLSearchParams\) => \{\s*setSearchParams\(next\)/)
  assert.match(source, /if \(selectedShopId == null\) \{\s*pushSearchParams\(next\)\s*\} else \{\s*replaceSearchParams\(next\)/)
  assert.match(source, /next\.delete\('shopId'\)[\s\S]*?replaceSearchParams\(next\)/)
  assert.doesNotMatch(source, /syncSearchParams/)
})

test('Explore detail shop changes replace history instead of stacking visited shops', () => {
  const source = explorePageSource()

  assert.match(source, /const sheetMode: SheetMode = selectedShopId && sheetParam === 'expanded' \? 'expanded' : 'peek'/)
  assert.match(source, /selectedShopId == null[\s\S]*?pushSearchParams\(next\)[\s\S]*?replaceSearchParams\(next\)/)
  assert.doesNotMatch(source, /setSheetMode/)
})

test('Explore expanded detail state is encoded in history for native back folding', () => {
  const source = explorePageSource()

  assert.match(source, /const sheetParam = searchParams\.get\('sheet'\)/)
  assert.match(source, /selectedShopId && sheetParam === 'expanded' \? 'expanded' : 'peek'/)
  assert.match(source, /next\.set\('sheet', 'expanded'\)/)
  assert.match(source, /next\.delete\('sheet'\)/)
  assert.match(source, /if \(selectedShopId != null && sheetParam !== 'expanded'\) \{[\s\S]*?pushSearchParams\(next\)/)
  assert.doesNotMatch(source, /setSheetMode/)
})

test('ExplorePage extracts the expanded detail supplement sections into a focused component', () => {
  const source = explorePageSource()
  const supplementSource = mapDetailSupplementSectionsSource()

  assert.match(source, /<MapDetailSupplementSections/)
  assert.match(supplementSource, /map-place-review-card/)
  assert.match(supplementSource, /map-sheet-link-section-v2/)
  assert.match(supplementSource, /map-sheet-recommend-section/)
  assert.match(supplementSource, /linkTypeToLabel/)
  assert.match(supplementSource, /getSafeExternalUrl/)
  assert.match(supplementSource, /url\.protocol === 'http:' \|\| url\.protocol === 'https:'/)
  assert.match(supplementSource, /safeLinks\.map/)
  assert.doesNotMatch(source, /map-place-review-card/)
  assert.doesNotMatch(source, /map-sheet-link-section-v2/)
  assert.doesNotMatch(source, /map-sheet-recommend-section/)
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
  const routeNavigationRules = cssRuleBodies(styles, '.map-route-navigation')
  const chipToolbarRules = cssRuleBodies(styles, '.map-chip-toolbar')
  const chipScrollRules = cssRuleBodies(styles, '.map-chip-scroll')
  const chipStatusRules = cssRuleBodies(styles, '.map-chip-status')

  assert.ok(topRules.some((rule) => /pointer-events:\s*none;/.test(rule)))
  assert.ok(routeNavigationRules.some((rule) => /pointer-events:\s*auto;/.test(rule)))
  assert.ok(chipToolbarRules.some((rule) => /align-self:\s*flex-start;/.test(rule)))
  assert.ok(chipScrollRules.some((rule) => /width:\s*fit-content;/.test(rule)))
  assert.ok(chipScrollRules.some((rule) => /flex:\s*0 1 auto;/.test(rule)))
  assert.ok(chipStatusRules.some((rule) => /pointer-events:\s*auto;/.test(rule)))
})

test('ExplorePage does not fabricate category filter chips without a facet API', () => {
  const source = explorePageSource()
  const quickChipsSource = mapQuickChipsSource()

  assert.doesNotMatch(source, /const categories = useMemo/)
  assert.doesNotMatch(source, /setFilter/)
  assert.doesNotMatch(source, /role="tablist"/)
  assert.doesNotMatch(source, /category && !shop\.categories\.includes/)
  assert.match(source, /Deferred facet filters/)
  assert.match(source, /MAP_QUICK_CHIPS/)
  assert.match(quickChipsSource, /className=\{`map-chip-status/)
  assert.match(quickChipsSource, /aria-pressed=\{isActive\}/)
  assert.match(source, /onToggle=\{toggleMapQuickChip\}/)
  assert.doesNotMatch(source, /className=\{`map-chip-status[\s\S]{0,280}setIsFilterSheetOpen\(true\)/)
  assert.match(source, /id: 'favorite'/)
  assert.match(source, /id: 'active'/)
  assert.doesNotMatch(source, /mappableShops\.length\}/)
})

test('Explore styles stay isolated from admin route styles', () => {
  const styles = appCssSource()
  const adminStyles = adminShopCssSource()
  const exploreStyles = exploreSearchCssSource()

  assert.match(styles, /\.map-llm-fab/)
  assert.doesNotMatch(adminStyles, /map-llm-/)
  assert.doesNotMatch(exploreStyles, /word-break:\s*break-word;/)
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
  const overlayControlsSource = mapOverlayControlsSource()
  const styles = appCssSource()
  const zoomButtonRules = cssRuleBodies(styles, '.map-zoom-button')
  const zoomIconRules = cssRuleBodies(styles, '.map-zoom-icon')
  const listIconRules = cssRuleBodies(styles, '.map-list-fab-icon')
  const listControlIconRules = cssRuleBodies(styles, '.map-list-fab .map-control-icon')
  const chipIconRules = cssRuleBodies(styles, '.map-chip-status::before')

  assert.doesNotMatch(source, /&& mapReady \? \(/)
  assert.doesNotMatch(source, /<strong>\{isListSheetOpen \?/)
  assert.match(mapSource, /className="map-zoom-icon"/)
  assert.match(overlayControlsSource, /className="map-list-fab-list-icon map-control-icon"/)
  assert.ok(listIconRules.some((rule) => /align-items:\s*center;/.test(rule)))
  assert.ok(listIconRules.some((rule) => /width:\s*28px;/.test(rule) && /height:\s*28px;/.test(rule)))
  assert.ok(listControlIconRules.some((rule) => /width:\s*28px;/.test(rule) && /height:\s*28px;/.test(rule)))
  assert.ok(chipIconRules.some((rule) => /width:\s*12px;/.test(rule) && /height:\s*12px;/.test(rule)))
  assert.ok(zoomButtonRules.some((rule) => /font-size:\s*0;/.test(rule)))
  assert.ok(zoomIconRules.some((rule) => /width:\s*24px;/.test(rule) && /height:\s*24px;/.test(rule)))
})
