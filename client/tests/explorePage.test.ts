import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const explorePageSource = () => fs.readFileSync(new URL('../src/pages/ExplorePage.tsx', import.meta.url), 'utf8')
const exploreTopSearchSource = () =>
  fs.readFileSync(new URL('../src/pages/explore/ExploreTopSearch.tsx', import.meta.url), 'utf8')
const mapQuickChipsSource = () =>
  fs.readFileSync(new URL('../src/pages/explore/MapQuickChips.tsx', import.meta.url), 'utf8')
const appliedFilterChipsSource = () =>
  fs.readFileSync(new URL('../src/shared/ui/AppliedFilterChips.tsx', import.meta.url), 'utf8')
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
const shopFiltersSource = () => fs.readFileSync(new URL('../src/shared/lib/shopFilters.ts', import.meta.url), 'utf8')
const shopFacetQuerySource = () =>
  fs.readFileSync(new URL('../src/shared/lib/shopFacetQuery.ts', import.meta.url), 'utf8')

const cssRuleBodies = (css: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = css.matchAll(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'g'))

  return Array.from(matches, (match) => match[1])
}

test('ExplorePage shares the search bar and filter sheet pattern with SearchPage', () => {
  const source = explorePageSource()
  const topSearchSource = exploreTopSearchSource()

  assert.match(source, /SearchFilterSheet/)
  assert.match(source, /selectedFilters=\{selectedFilters\}/)
  assert.match(source, /onApplyFilters=\{applyFilters\}/)
  assert.match(source, /<AppTopNavigation/)
  assert.doesNotMatch(source, /title="지도"/)
  assert.match(source, /onBack=\{handleExploreBack\}/)
  assert.doesNotMatch(topSearchSource, /map-search-home-button/)
  assert.doesNotMatch(source, /onHomeClick=/)
  assert.match(topSearchSource, /className="search-screen-bar map-search-field"/)
  assert.match(topSearchSource, /className="search-filter-button map-filter-button"/)
  assert.match(topSearchSource, /aria-label=\{appliedFilterCount > 0 \? `/)
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
  assert.match(source, /const isMapAssistantEnabled = false/)
  assert.match(source, /visible=\{isMapAssistantEnabled && !isListSheetOpen && sheetMode !== 'expanded'\}/)
  assert.match(source, /const showAssistantReturn =\s+isMapAssistantEnabled &&/)
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
  assert.match(source, /onClose=\{\(\) => handleSwitchView\('map'\)\}/)
  assert.match(resultsSheetSource, /import \{ BottomSheet \} from '@aniwhere\/tds-mobile'/)
  assert.match(resultsSheetSource, /<BottomSheet[\s\S]*open=\{visible\}[\s\S]*onClose=\{onClose\}/)
  assert.match(resultsSheetSource, /UNSAFE_disableFocusLock/)
  assert.match(resultsSheetSource, /disableDimmer/)
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
  assert.doesNotMatch(peekSheetSource, /Ait|ait-|alt-/)
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
  const styles = appCssSource()

  assert.match(source, /<MapDetailSummaryCard/)
  assert.match(summarySource, /map-sheet-identity-card/)
  assert.match(summarySource, /map-sheet-keyword-row/)
  assert.match(summarySource, /map-place-tabs/)
  assert.doesNotMatch(summarySource, /map-sheet-ai-summary/)
  assert.doesNotMatch(summarySource, /description:/)
  assert.match(summarySource, /onTabChange\('info'\)/)
  assert.match(summarySource, /onTabChange\('works'\)/)
  assert.doesNotMatch(source, /className="map-place-action-grid"/)
  assert.ok(cssRuleBodies(styles, '.map-place-tabs button').some((rule) => /font-size:\s*var\(--ait-font-size-body-sm\);/.test(rule)))
})

test('ExplorePage extracts the expanded detail info rows into a focused component', () => {
  const source = explorePageSource()
  const infoSource = mapDetailInfoCardSource()
  const styles = appCssSource()

  assert.match(source, /<MapDetailInfoCard/)
  assert.match(source, /description=\{detailDescription\}/)
  assert.match(infoSource, /map-sheet-info-list-v3/)
  assert.match(infoSource, /import \{ Button, ListRow \} from '@aniwhere\/tds-mobile'/)
  assert.match(infoSource, /MapDetailRow/)
  assert.match(infoSource, /'map-sheet-ai-summary'[\s\S]*?'map-sheet-ai-summary-priority'/)
  assert.match(infoSource, /visibleAiSummary \? \([\s\S]*?'map-sheet-ai-summary-priority'[\s\S]*?\) : null\}\s*<ul className="map-sheet-info-list-v2 map-sheet-info-list-v3">/)
  assert.match(infoSource, /AI가 요약한 정보/)
  assert.match(infoSource, /const visibleAiSummary/)
  assert.match(infoSource, /const aiSummaryPreviewLimit = 72/)
  assert.match(infoSource, /const shouldShowVisitTip/)
  assert.match(infoSource, /description\?: string \| null/)
  assert.match(infoSource, /<ListRow/)
  assert.match(infoSource, /'map-sheet-detail-row-v3--has-icon'/)
  assert.match(infoSource, /descriptionAction \? 'map-sheet-detail-row-v3--has-directions' : null/)
  assert.match(infoSource, /left=\{<span className="map-sheet-detail-icon">/)
  assert.match(infoSource, /contents=\{/)
  assert.match(infoSource, /right=\{right\}/)
  assert.match(infoSource, /<Button[\s\S]*?className="map-place-directions-button"[\s\S]*?color="primary"[\s\S]*?size="small"[\s\S]*?variant="weak"/)
  assert.match(infoSource, /descriptionAction\?: ReactNode/)
  assert.match(infoSource, /<div className="map-sheet-detail-value-row">[\s\S]*?<strong>\{description\}<\/strong>[\s\S]*?\{descriptionAction\}[\s\S]*?<\/div>/)
  assert.match(infoSource, /<MapDetailRow[\s\S]*?className="map-sheet-detail-row-address"[\s\S]*?description=\{shop\.address\}[\s\S]*?descriptionAction=/)
  assert.match(infoSource, /<span>\{label\}<\/span>[\s\S]*?\) : \(\s*<strong>\{description\}<\/strong>\s*\)/)
  assert.doesNotMatch(infoSource, /map-sheet-ai-summary-standalone/)
  assert.match(infoSource, /formatRelativeUpdated/)
  assert.match(infoSource, /const updatedLabel = formatRelativeUpdated\(shop\.updatedAt\)/)
  assert.match(infoSource, /MapDetailRow icon="calendar" label="최근 업데이트"/)
  assert.match(infoSource, /MapDetailRow icon="clock" label="영업 상태"/)
  assert.match(infoSource, /<MapDetailRow[\s\S]*?icon="building"[\s\S]*?label="위치"/)
  assert.match(infoSource, /<MapDetailRow[\s\S]*?icon="collection"[\s\S]*?label="취급 정보"/)
  assert.doesNotMatch(infoSource, /map-sheet-info-header/)
  assert.doesNotMatch(infoSource, /map-place-address-button/)
  assert.doesNotMatch(infoSource, /map-place-address-action/)
  assert.doesNotMatch(infoSource, /updatedNote/)
  assert.doesNotMatch(source, /function MapDetailRow/)
  assert.doesNotMatch(source, /className="section map-sheet-info-card/)
  assert.doesNotMatch(infoSource, /<div className="map-sheet-detail-row-v3"/)
  assert.doesNotMatch(infoSource, /from '\.\.\/\.\.\/shared\/ui\/ait/)
  assert.ok(cssRuleBodies(appCssSource(), '.map-sheet-info-list-v2').some((rule) => /list-style:\s*none;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-shell-detail').some((rule) => /--map-sheet-expanded-inline:\s*20px;/.test(rule)))
  assert.equal(cssRuleBodies(styles, '.map-sheet-info-header').length, 0)
  assert.ok(cssRuleBodies(styles, '.map-sheet-info-list-v3').some((rule) => /padding:\s*10px 0 4px;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-row-v3').some((rule) => /padding:\s*0 var\(--map-sheet-expanded-inline\);/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-row-v3:first-of-type').some((rule) => /padding-inline:\s*var\(--map-sheet-first-row-inline\);/.test(rule)))
  assert.match(styles, /@supports selector\(:has\(\.map-sheet-detail-icon\)\)/)
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-row-v3--has-icon > .ait-list-row-asset').some((rule) => /width:\s*36px;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-row-v3--has-icon > .ait-list-row-asset').some((rule) => /flex:\s*0 0 36px;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-row-v3--has-icon > .ait-list-row-copy').some((rule) => /flex:\s*1 1 auto;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-row-v3--has-directions > .ait-list-row-right').some((rule) => /align-self:\s*center;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-row-v3 > :has(.map-sheet-detail-icon)').some((rule) => /width:\s*100%;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-icon').some((rule) => /height:\s*36px;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-icon').some((rule) => /width:\s*36px;/.test(rule)))
  assert.doesNotMatch(
    cssRuleBodies(styles, '.map-sheet-detail-row-address').join('\n'),
    /align-items:\s*center;|padding:/,
  )
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-value-row').some((rule) => /grid-template-columns:\s*minmax\(0, 1fr\) auto;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-row-address .map-sheet-detail-copy').some((rule) => /width:\s*100%;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-row-address .map-sheet-detail-copy').some((rule) => /grid-template-areas:\s*'label action'\s*'value action';/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-row-address .map-sheet-detail-copy > span').some((rule) => /grid-area:\s*label;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-row-address .map-sheet-detail-value-row').some((rule) => /display:\s*contents;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-row-address .map-sheet-detail-value-row strong').some((rule) => /grid-area:\s*value;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-row-address .map-place-directions-button').some((rule) => /grid-area:\s*action;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-detail-copy').some((rule) => /gap:\s*var\(--ait-space-1\);/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-place-directions-button').some((rule) => /height:\s*36px;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-place-directions-button > :is(div, span)').some((rule) => /height:\s*36px;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-place-directions-button').some((rule) => /white-space:\s*nowrap;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-ai-summary').some((rule) => /margin:\s*10px var\(--map-sheet-expanded-inline\) 10px;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-ai-summary').some((rule) => /padding:\s*14px 16px;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-ai-summary p').some((rule) => /-webkit-line-clamp:\s*2;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-sheet-ai-summary-expanded p').some((rule) => /-webkit-line-clamp:\s*unset;/.test(rule)))
})

test('Explore detail media uses uploaded shop photos only instead of fabricated external placeholders', () => {
  const source = explorePageSource()
  const mediaSource = mapDetailMediaSectionSource()

  assert.match(source, /const localImages = uploadedPhotos\.map/)
  assert.match(source, /return \[\.\.\.apiImages, \.\.\.localImages\]/)
  assert.match(mediaSource, /detailMediaItems\.length > 0/)
  assert.doesNotMatch(source, /picsum\.photos/)
  assert.doesNotMatch(mediaSource, /picsum\.photos/)
  assert.doesNotMatch(source, /aniwhere-\$\{shop\.id\}/)
})

test('ExplorePage extracts the expanded detail media section into a focused component', () => {
  const source = explorePageSource()
  const mediaSource = mapDetailMediaSectionSource()

  assert.match(source, /<MapDetailMediaSection/)
  assert.match(source, /detailMediaItems=\{detailPreviewMediaItems\}/)
  assert.match(source, /totalMediaCount=\{detailMediaItems\.length\}/)
  assert.match(mediaSource, /map-sheet-media-grid/)
  assert.match(mediaSource, /detailMediaItems\.length > 0/)
  assert.match(mediaSource, /totalMediaCount > detailMediaItems\.length/)
  assert.match(mediaSource, /map-sheet-expanded-drag-handle/)
  assert.doesNotMatch(mediaSource, /shop\.links\.length/)
  assert.doesNotMatch(mediaSource, /shop\.works\.length,\s*4/)
  assert.doesNotMatch(source, /className=\{`map-sheet-media/)
  assert.doesNotMatch(source, /map-sheet-media-grid/)
})

test('Explore detail sheet hides duplicate chrome controls in Toss navigation runtime', () => {
  const source = explorePageSource()
  const mediaSource = mapDetailMediaSectionSource()

  assert.match(source, /const usesTossNavigation = useMemo\(\(\) => isAppsInTossRuntime\(\), \[\]\)/)
  assert.match(source, /!usesTossNavigation \? \([\s\S]*?<AppTopNavigation/)
  assert.doesNotMatch(source, /showTopbarControls=/)
  assert.doesNotMatch(mediaSource, /GlobalNavigationMenu/)
  assert.doesNotMatch(mediaSource, /showTopbarControls/)
})

test('Explore detail selection pushes history so native back closes the sheet first', () => {
  const source = explorePageSource()

  assert.match(source, /const replaceSearchParams = \(next: URLSearchParams\) => \{\s*setSearchParams\(next, \{ replace: true \}\)/)
  assert.match(source, /const pushSearchParams = \(next: URLSearchParams\) => \{\s*setSearchParams\(next\)/)
  assert.match(source, /if \(selectedShopId == null\) \{\s*pushSearchParams\(next\)\s*\} else \{\s*replaceSearchParams\(next\)/)
  assert.match(source, /next\.delete\('shopId'\)[\s\S]*?replaceSearchParams\(next\)/)
  assert.doesNotMatch(source, /syncSearchParams/)
})

test('Explore detail back returns to the originating search route when opened from search results', () => {
  const source = explorePageSource()

  assert.match(source, /type ExploreLocationState = \{\s*returnTo\?: string/)
  assert.match(source, /function isSafeExploreReturnTo\(returnTo: string \| undefined\)/)
  assert.match(source, /const safeRouteReturnTo = isSafeExploreReturnTo\(routeState\?\.returnTo\)/)
  assert.match(source, /if \(selectedShopId != null && safeRouteReturnTo\) \{\s*navigate\(safeRouteReturnTo, \{ replace: true \}\)/)
})

test('Explore list-map view switches replace history so removed chips do not resurrect', () => {
  const source = explorePageSource()

  assert.match(source, /const moveViewMode = \(nextViewMode: ViewMode\) => \{[\s\S]*?next\.set\('view', nextViewMode\)[\s\S]*?replaceSearchParams\(next\)[\s\S]*?\}/)
  assert.doesNotMatch(source, /next\.set\('view', nextViewMode\)\s*pushSearchParams\(next\)/)
  assert.match(source, /if \(isListSheetOpen\) \{\s*handleSwitchView\('map'\)/)
})

test('Explore list toggle does not replace a selected shop bottom sheet with result rows', () => {
  const source = explorePageSource()
  const overlayControlsSource = mapOverlayControlsSource()

  assert.match(source, /<MapOverlayControls[\s\S]*?showListToggle=\{selectedShopId == null\}/)
  assert.match(overlayControlsSource, /showListToggle: boolean/)
  assert.match(overlayControlsSource, /\{showListToggle \? \(/)
  assert.doesNotMatch(source, /if \(detailShop\) \{\s*restoreListView\(\)\s*return\s*\}/)
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
  assert.match(supplementSource, /map-sheet-work-feed/)
  assert.match(supplementSource, /map-sheet-work-row/)
  assert.match(supplementSource, /map-sheet-work-cover/)
  assert.match(supplementSource, /map-sheet-work-more/)
  assert.match(supplementSource, /visibleWorks = isWorkFeedExpanded \? shop\.works : shop\.works\.slice\(0, WORK_FEED_PREVIEW_LIMIT\)/)
  assert.match(supplementSource, /to=\{`\/search\?scope=work&keyword=\$\{encodeURIComponent\(work\.name\)\}`\}/)
  assert.match(supplementSource, /이 작품으로 매장 더 보기/)
  assert.doesNotMatch(supplementSource, /map-sheet-token-cloud/)
  assert.match(supplementSource, /map-sheet-photo-feed/)
  assert.match(supplementSource, /activeTab === 'works'/)
  assert.match(supplementSource, /activeTab === 'photos'/)
  assert.doesNotMatch(source, /map-place-review-card/)
  assert.doesNotMatch(source, /map-sheet-link-section-v2/)
  assert.doesNotMatch(source, /map-sheet-recommend-section/)
  assert.ok(cssRuleBodies(appCssSource(), '.map-sheet-work-feed').some((rule) => /display:\s*flex;/.test(rule)))
  assert.ok(cssRuleBodies(appCssSource(), '.map-sheet-work-row').some((rule) => /grid-template-columns:\s*44px minmax\(0, 1fr\) auto;/.test(rule)))
  assert.ok(cssRuleBodies(appCssSource(), '.map-sheet-work-cover').some((rule) => /width:\s*44px;/.test(rule)))
})
test('ExplorePage exposes map viewport search after the map moves', () => {
  const source = explorePageSource()

  assert.match(source, /onViewportChange=\{handleMapViewportChange\}/)
  assert.match(source, /mapViewportFilter/)
  assert.match(source, /이 지역 매장 검색/)
})

test('ExplorePage sends selected filters to the shop API instead of local-only chips', () => {
  const source = explorePageSource()

  assert.match(source, /import \{ keepPreviousData, useMutation, useQuery \} from '@tanstack\/react-query'/)
  assert.match(source, /parseShopFilters\(searchParams\)/)
  assert.match(source, /toShopSearchParams\(selectedFilters\)/)
  assert.match(source, /queryKey: \['shops', 'explore-map-source', selectedSearchParams\]/)
  assert.match(source, /getShops\(\{ page: 0, size: MAP_FETCH_SIZE, \.\.\.selectedSearchParams \}\)/)
  assert.match(source, /placeholderData: keepPreviousData/)
  assert.match(source, /const appliedFilterCount = countShopFilters\(selectedFilters\)/)
  assert.doesNotMatch(source, /countShopFilters\(selectedFilters\) \+ \(mapViewportFilter \? 1 : 0\)/)
  assert.match(source, /selectedSearchParams\.regionIds\.length > 0/)
  assert.match(source, /selectedSearchParams\.regionIds\.includes\(shop\.regionId\)/)
  assert.match(source, /writeShopFilters\(searchParams, nextFilters\)/)
  assert.doesNotMatch(source, /const nextViewportFilter = mapViewport\?\.bounds \?\? mapViewportFilter/)
  assert.doesNotMatch(source, /setMapViewportFilter\(nextViewportFilter\)/)
  assert.match(source, /viewportBounds=\{mapViewport\?\.bounds \?\? mapViewportFilter\}/)
  assert.match(source, /toggleActiveStatusFilter/)
  assert.match(source, /id: 'active'/)
})

test('ExplorePage keeps the map mounted while filter chips refetch shop results', () => {
  const source = explorePageSource()

  assert.match(source, /<ShopMap\s+shops=\{mappableShops\}/)
  assert.doesNotMatch(source, /shopsQuery\.isLoading && allShops\.length === 0 \? \(/)
  assert.doesNotMatch(source, /<div className="map-empty">\s*<p>매장 지도를 준비하고 있습니다\.<\/p>/)
})

test('ExplorePage closes a selected POI sheet when applied filters remove that shop from results', () => {
  const source = explorePageSource()

  assert.match(source, /const selectedShopIsInFilteredResults =\s*selectedShopId == null \|\| shopsWithDistance\.some\(\(shop\) => shop\.id === selectedShopId\)/)
  assert.match(source, /selectedShopId == null \|\|\s*appliedFilterCount === 0 \|\|\s*shopsQuery\.isPlaceholderData \|\|\s*!shopsQuery\.isSuccess \|\|\s*selectedShopIsInFilteredResults/)
  assert.match(source, /next\.delete\('shopId'\)[\s\S]*?next\.delete\('sheet'\)/)
  assert.match(source, /if \(selectionOrigin === 'list'\) \{\s*next\.set\('view', 'list'\)/)
  assert.match(source, /setSearchParams\(next, \{ replace: true \}\)/)
})

test('ExplorePage shows removable applied filters without opening the filter sheet', () => {
  const source = explorePageSource()
  const resultsSheetSource = mapResultsSheetSource()
  const chipSource = appliedFilterChipsSource()
  const filtersSource = shopFiltersSource()
  const facetQuerySource = shopFacetQuerySource()
  const styles = appCssSource()

  assert.match(source, /import \{ getShop, getShopFacets, getShops \} from '\.\.\/shared\/api\/shops'/)
  assert.match(source, /import \{ AppliedFilterChips \} from '\.\.\/shared\/ui\/AppliedFilterChips'/)
  assert.match(source, /const hasAppliedFilterChips = appliedFilterCount > 0/)
  assert.match(source, /const appliedFacetParams = \{ includeRegions: true, includeCategories: true, includeWorkTypes: false \}/)
  assert.match(source, /queryKey: shopFacetQueryKey\(appliedFacetParams\)/)
  assert.match(source, /queryFn: \(\) => getShopFacets\(appliedFacetParams\)/)
  assert.match(source, /SHOP_FACET_STALE_TIME_MS/)
  assert.match(source, /SHOP_FACET_GC_TIME_MS/)
  assert.match(facetQuerySource, /export function shopFacetQueryKey/)
  assert.doesNotMatch(source, /explore-applied-filter-facets/)
  assert.doesNotMatch(source, /includeMapArea=\{mapViewportFilter != null\}/)
  assert.match(source, /removeAppliedFilterChip/)
  assert.match(source, /className="map-chip-composite-row"/)
  assert.match(source, /appliedFilters=\{/)
  assert.match(resultsSheetSource, /appliedFilters: ReactNode/)
  assert.match(resultsSheetSource, /<div className="map-results-sheet-top">\s*\{topSearch\}\s*\{appliedFilters\}/)
  assert.doesNotMatch(source, /removeAppliedFilterChip[\s\S]{0,260}setIsFilterSheetOpen\(true\)/)
  assert.match(chipSource, /buildAppliedShopFilterChips/)
  assert.doesNotMatch(chipSource, /includeMapArea/)
  assert.doesNotMatch(filtersSource, /facet: 'mapArea'/)
  assert.ok(cssRuleBodies(styles, '.map-chip-composite-row').some((rule) => /display:\s*flex;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-chip-composite-row .map-chip-toolbar').some((rule) => /flex:\s*0 0 auto;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-applied-filter-chips').some((rule) => /flex:\s*1 1 auto;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-results-sheet-top .applied-filter-chip-rail').some((rule) => /margin-top:\s*calc\(var\(--ait-space-2\) \* -1\);/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-explore-top .applied-filter-chip-rail').some((rule) => /pointer-events:\s*auto;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.map-explore-top-hidden .applied-filter-chip-rail').some((rule) => /pointer-events:\s*none;/.test(rule)))
  assert.doesNotMatch(styles, /--ait-color-brand-weak/)
  assert.doesNotMatch(styles, /--ait-color-brand-strong/)
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
  assert.ok(fieldRules.some((rule) => /background:\s*var\(--ait-color-surface-raised\);/.test(rule)))
  assert.ok(filterRules.some((rule) => /width:\s*46px;/.test(rule)))
  assert.ok(filterRules.some((rule) => /border:\s*1px solid var\(--ait-color-border-strong\);/.test(rule)))
  assert.ok(filterRules.some((rule) => /box-shadow:\s*var\(--ait-shadow-lg\);/.test(rule)))
})

test('Explore map overlay controls avoid competing raised layers', () => {
  const styles = appCssSource()
  const chipRules = cssRuleBodies(styles, '.map-chip-status')
  const areaSearchRules = cssRuleBodies(styles, '.map-area-search-button')

  assert.ok(chipRules.some((rule) => /box-shadow:\s*none;/.test(rule)))
  assert.ok(areaSearchRules.some((rule) => /background:\s*var\(--ait-color-surface-raised\);/.test(rule)))
  assert.ok(areaSearchRules.some((rule) => /color:\s*var\(--text-strong\);/.test(rule)))
  assert.doesNotMatch(styles, /\.map-surface-sheet-open\s+\.map-list-fab\s*\{[\s\S]*?display:\s*none;/)
})

test('Explore peek sheet keeps map controls clear of the selected shop summary', () => {
  const source = explorePageSource()
  const styles = exploreSearchCssSource()
  const peekSurfaceRules = cssRuleBodies(styles, '.map-surface-app-v2.map-surface-sheet-peek')
  const peekLocationRules = cssRuleBodies(styles, '.map-surface-sheet-peek .map-location-fab')
  const listRules = cssRuleBodies(styles, '.map-list-fab')
  const zoomRules = cssRuleBodies(styles, '.map-zoom-control')

  assert.match(source, /sheetMode === 'peek' && detailShop \? 'map-surface-sheet-peek' : ''/)
  assert.ok(peekSurfaceRules.some((rule) => /--map-control-bottom:\s*clamp\(260px,\s*42dvh,\s*360px\);/.test(rule)))
  assert.ok(peekLocationRules.some((rule) => /display:\s*none;/.test(rule)))
  assert.ok(listRules.some((rule) => /bottom:\s*calc\(var\(--map-control-bottom/.test(rule)))
  assert.ok(zoomRules.some((rule) => /bottom:\s*var\(--map-control-bottom/.test(rule)))
  assert.doesNotMatch(styles, /\.map-surface-sheet-peek\s+\.map-list-fab\s*\{[\s\S]*?display:\s*none;/)
})

test('Explore list sheet reserves space around the map toggle button', () => {
  const styles = exploreSearchCssSource()
  const listOpenRules = cssRuleBodies(styles, '.map-surface-app-v2.map-surface-list-open')
  const listButtonRules = cssRuleBodies(styles, '.map-surface-list-open .map-list-fab')
  const listPanelRules = cssRuleBodies(styles, '.map-surface-list-open .map-results-sheet-list')

  assert.ok(listOpenRules.some((rule) => /--map-control-bottom:\s*112px;/.test(rule)))
  assert.ok(listButtonRules.some((rule) => /bottom:\s*max\(72px,\s*calc\(env\(safe-area-inset-bottom\) \+ 64px\)\);/.test(rule)))
  assert.ok(listPanelRules.some((rule) => /padding-bottom:\s*max\(104px,\s*calc\(env\(safe-area-inset-bottom\) \+ 96px\)\);/.test(rule)))
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
  assert.match(source, /MAP_QUICK_CHIPS/)
  assert.match(quickChipsSource, /className=\{`map-chip-status/)
  assert.match(quickChipsSource, /aria-pressed=\{isActive\}/)
  assert.match(source, /onToggle=\{toggleMapQuickChip\}/)
  assert.doesNotMatch(source, /className=\{`map-chip-status[\s\S]{0,280}setIsFilterSheetOpen\(true\)/)
  assert.match(source, /id: 'active'/)
  assert.match(source, /if \(chipId !== 'active'\) \{\s*return\s*\}/)
  assert.doesNotMatch(source, /id: 'favorite'/)
  assert.doesNotMatch(source, /favoriteQuickChipActive/)
  assert.doesNotMatch(source, /setFavoriteQuickChipActive/)
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
