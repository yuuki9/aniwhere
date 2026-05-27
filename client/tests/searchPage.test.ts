import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const searchPageSource = () => fs.readFileSync(new URL('../src/pages/SearchPage.tsx', import.meta.url), 'utf8')
const shopsApiSource = () => fs.readFileSync(new URL('../src/shared/api/shops.ts', import.meta.url), 'utf8')
const apiTypesSource = () => fs.readFileSync(new URL('../src/shared/api/types.ts', import.meta.url), 'utf8')
const filterSheetSource = () => fs.readFileSync(new URL('../src/shared/ui/SearchFilterSheet.tsx', import.meta.url), 'utf8')
const shopFacetQuerySource = () =>
  fs.readFileSync(new URL('../src/shared/lib/shopFacetQuery.ts', import.meta.url), 'utf8')
const appliedFilterChipsSource = () =>
  fs.readFileSync(new URL('../src/shared/ui/AppliedFilterChips.tsx', import.meta.url), 'utf8')
const appCssSource = () =>
  ['../src/App.css', '../src/styles/explore-search.css']
    .map((path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8'))
    .join('\n')

const cssRuleBodies = (css: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = css.matchAll(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'g'))

  return Array.from(matches, (match) => match[1])
}

const cssRuleBody = (css: string, selector: string) => {
  const matches = cssRuleBodies(css, selector)

  assert.ok(matches.length > 0, `${selector} rule not found`)
  return matches[0]
}

test('SearchPage does not build recommendations by fetching an aggregate shop page', () => {
  const source = searchPageSource()

  assert.doesNotMatch(source, /search-page-facets/)
  assert.doesNotMatch(source, /getShops\(\{\s*page:\s*0,\s*size:\s*200/)
  assert.doesNotMatch(source, /quickKeywords/)
})

test('SearchPage renders shop results from API fields without inferred fallback copy', () => {
  const source = searchPageSource()

  assert.match(source, /keyword:\s*searchKeyword/)
  assert.doesNotMatch(source, /regionId \?\? '-'/)
  assert.doesNotMatch(source, /shop\.works\.length/)
  assert.doesNotMatch(source, /작품 \{shop\.works\.length\}/)
})

test('SearchPage sends work-scoped searches to the shop search API workKeyword parameter', () => {
  const source = searchPageSource()
  const shopsApi = shopsApiSource()
  const apiTypes = apiTypesSource()

  assert.match(source, /const currentSearchScope = searchParams\.get\('scope'\) === 'work' \? 'work' : 'shop'/)
  assert.match(source, /queryKey: \['shops', 'search-page-results', currentSearchScope, currentKeyword, selectedFilters, currentPage\]/)
  assert.match(source, /if \(currentSearchScope === 'work'\) \{[\s\S]*workKeyword: searchKeyword/)
  assert.match(source, /if \(currentSearchScope === 'work'\) \{/)
  assert.match(source, /next\.set\('scope', 'work'\)/)
  assert.match(shopsApi, /workKeyword:\s*params\.workKeyword/)
  assert.match(apiTypes, /workKeyword\?: string/)
})

test('SearchPage opens explore details without adding implicit region filters and preserves the search route', () => {
  const source = searchPageSource()

  assert.match(source, /const location = useLocation\(\)/)
  assert.match(source, /const searchReturnTo = `\$\{location\.pathname\}\$\{location\.search\}`/)
  assert.match(source, /const buildExploreHref = \(shopId: number\) =>/)
  assert.match(source, /to=\{buildExploreHref\(shop\.id\)\}/)
  assert.match(source, /state=\{\{ returnTo: searchReturnTo \}\}/)
  assert.doesNotMatch(source, /buildExploreHref\(shop\.id, shop\.regionId\)/)
  assert.doesNotMatch(source, /next\.set\('regionIds'/)
})

test('SearchPage default search bar falls back to workKeyword when shop-name search is empty', () => {
  const source = searchPageSource()

  assert.match(source, /async function searchShopsFromSearchBar/)
  assert.match(source, /const shopResults = await getShops\(\{[\s\S]*keyword: searchKeyword/)
  assert.match(source, /if \(shopResults\.content\.length > 0 \|\| currentPage > 0\) \{/)
  assert.match(source, /return getShops\(\{[\s\S]*workKeyword: searchKeyword/)
})

test('SearchPage exposes an explicit nearby CTA through geolocation instead of silent permission prompts', () => {
  const source = searchPageSource()

  assert.match(source, /requestCurrentLocation/)
  assert.match(source, /buildNearbyExploreHref/)
  assert.match(source, /내 위치에서 가까운 매장을/)
  assert.match(source, /찾아볼까요\?/)
  assert.match(source, /가까운 매장 찾기/)
  assert.doesNotMatch(source, /버튼을 누를 때만 위치 권한을 요청해요/)
})

test('SearchPage has a filter button and bottom sheet shell without client-side facet generation', () => {
  const source = searchPageSource()
  const filterSheet = filterSheetSource()
  const facetQuery = shopFacetQuerySource()

  assert.match(source, /search-filter-button/)
  assert.match(source, /SearchFilterSheet/)
  assert.match(source, /selectedFilters=\{selectedFilters\}/)
  assert.match(source, /onApplyFilters=\{applyFilters\}/)
  assert.match(filterSheet, /search-filter-sheet/)
  assert.match(filterSheet, /import \{ Button \} from '@aniwhere\/tds-mobile'/)
  assert.match(filterSheet, /getShopFacets/)
  assert.match(filterSheet, /filterCloseButtonRef/)
  assert.match(filterSheet, /event\.key === 'Escape'/)
  assert.match(filterSheet, /querySelectorAll<HTMLElement>/)
  assert.match(filterSheet, /선택 초기화/)
  assert.match(filterSheet, /필터 적용/)
  assert.match(filterSheet, /search-filter-chip-list/)
  assert.match(filterSheet, /search-filter-chip-button/)
  assert.match(filterSheet, /const facetParams = \{ includeRegions: true, includeCategories: true, includeWorkTypes: false \}/)
  assert.match(filterSheet, /queryKey: shopFacetQueryKey\(facetParams\)/)
  assert.match(filterSheet, /queryFn: \(\) => getShopFacets\(facetParams\)/)
  assert.match(filterSheet, /SHOP_FACET_STALE_TIME_MS/)
  assert.match(filterSheet, /SHOP_FACET_GC_TIME_MS/)
  assert.match(filterSheet, /disabled=\{!hasDraftChanges \|\| !facetQuery\.isFetched\}/)
  assert.doesNotMatch(filterSheet, /disabled=\{facetQuery\.isFetching\}/)
  assert.match(facetQuery, /export const SHOP_FACET_STALE_TIME_MS = 1000 \* 60 \* 5/)
  assert.match(facetQuery, /export const SHOP_FACET_GC_TIME_MS = 1000 \* 60 \* 30/)
  assert.match(facetQuery, /includeRegions\?: boolean/)
  assert.doesNotMatch(filterSheet, /toShopFacetParams/)
  assert.doesNotMatch(filterSheet, /disabled=\{region\.disabled\}/)
  assert.doesNotMatch(filterSheet, /disabled=\{category\.disabled\}/)
  assert.match(filterSheet, /draftFilters\.regionIds\.includes\(region\.id\)/)
  assert.match(filterSheet, /regionIds: current\.regionIds\.includes\(region\.id\)/)
  assert.doesNotMatch(filterSheet, /<ListRow/)
  assert.doesNotMatch(filterSheet, /search-filter-option-count/)
  assert.doesNotMatch(filterSheet, /selectWork/)
  assert.doesNotMatch(filterSheet, /selectStatus/)
  assert.doesNotMatch(filterSheet, /statusOptions/)
  assert.doesNotMatch(filterSheet, /search-filter-work/)
  assert.doesNotMatch(filterSheet, /search-filter-status/)
  assert.doesNotMatch(filterSheet, /facet API가 연결되면/)
  assert.doesNotMatch(source, /search-page-facets/)
})

test('SearchPage sends selected filters to shop search requests and preserves them while searching', () => {
  const source = searchPageSource()

  assert.match(source, /parseShopFilters\(searchParams\)/)
  assert.match(source, /toShopSearchParams\(selectedFilters\)/)
  assert.match(source, /countShopFilters\(selectedFilters\)/)
  assert.match(source, /const hasSearchCriteria = currentKeyword\.trim\(\)\.length > 0 \|\| appliedFilterCount > 0/)
  assert.doesNotMatch(source, /getShopsForSelectedRegions/)
  assert.match(source, /writeShopFilters\(searchParams, nextFilters\)/)
  assert.match(source, /const applyFilters = \(nextFilters: ShopFilters\) => \{[\s\S]*next\.set\('page', '0'\)[\s\S]*setSearchParams\(next, \{ replace: true \}\)/)
  assert.match(source, /const removeAppliedFilterChip = useCallback\([\s\S]*next\.set\('page', '0'\)[\s\S]*setSearchParams\(next, \{ replace: true \}\)/)
  assert.match(source, /selectedFilters,\s*currentPage/)
  assert.match(source, /\.\.\.selectedSearchParams/)
  assert.match(source, /enabled: hasSearchCriteria/)
  assert.match(source, /!\s*hasSearchCriteria\s*\? \(/)
  assert.doesNotMatch(source, /enabled: currentKeyword\.trim\(\)\.length > 0/)
  assert.doesNotMatch(source, /!\s*currentKeyword\s*\? \(/)
})

test('SearchPage shows removable applied filter chips below the TDS search field', () => {
  const source = searchPageSource()
  const chipSource = appliedFilterChipsSource()
  const styles = appCssSource()

  assert.match(source, /import \{ getShopFacets, getShops \} from '\.\.\/shared\/api\/shops'/)
  assert.match(source, /import \{ AppliedFilterChips \} from '\.\.\/shared\/ui\/AppliedFilterChips'/)
  assert.match(source, /removeAppliedShopFilterChip/)
  assert.match(source, /const appliedFacetParams = \{ includeRegions: true, includeCategories: true, includeWorkTypes: false \}/)
  assert.match(source, /queryKey: shopFacetQueryKey\(appliedFacetParams\)/)
  assert.match(source, /queryFn: \(\) => getShopFacets\(appliedFacetParams\)/)
  assert.doesNotMatch(source, /search-applied-filter-facets/)
  assert.match(source, /enabled: appliedFilterCount > 0/)
  assert.match(source, /<AppliedFilterChips/)
  assert.match(source, /facets=\{appliedFacetQuery\.data\}/)
  assert.match(source, /onRemoveFilter=\{removeAppliedFilterChip\}/)
  assert.match(chipSource, /buildAppliedShopFilterChips/)
  assert.match(chipSource, /className="applied-filter-chip-close"/)
  assert.ok(cssRuleBodies(styles, '.search-screen-top-v2 .applied-filter-chip-rail').some((rule) => /margin-top:\s*var\(--ait-space-2\);/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.applied-filter-chip').some((rule) => /border-radius:\s*var\(--ait-radius-full\);/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.applied-filter-chip-close').some((rule) => /width:\s*16px;/.test(rule)))
})

test('SearchPage relies on the TDS SearchField chrome instead of rendering a second search icon button', () => {
  const source = searchPageSource()
  const styles = appCssSource()

  assert.match(source, /<SearchField/)
  assert.match(source, /takeSpace=\{false\}/)
  assert.match(source, /<form className="search-screen-form"/)
  assert.doesNotMatch(source, /<form className="search-screen-bar"/)
  assert.doesNotMatch(source, /className="search-screen-input"/)
  assert.doesNotMatch(source, /className="search-screen-icon"/)
  assert.doesNotMatch(styles, /\.search-screen-icon\s*\{/)
})

test('SearchPage header uses brand navigation and compact icon proportions', () => {
  const source = searchPageSource()
  const styles = appCssSource()
  const searchFormRules = cssRuleBodies(styles, '.search-screen-form')
  const topRules = cssRuleBodies(styles, '.search-screen-top-v2')
  const contentRules = cssRuleBodies(styles, '.search-screen-content-v2')

  assert.match(source, /<AppTopNavigation/)
  assert.match(source, /import \{ SearchField \} from '@aniwhere\/tds-mobile'/)
  assert.match(source, /<SearchField/)
  assert.match(source, /onDeleteClick=\{\(\) => setKeyword\(''\)\}/)
  assert.doesNotMatch(source, /title="검색"/)
  assert.doesNotMatch(source, /search-page-titlebar/)
  assert.doesNotMatch(source, /search-mode-tabs/)
  assert.doesNotMatch(source, /search-mode-tab/)
  assert.match(source, /placeholder="매장, 지역, 작품 이름 검색"/)
  assert.ok(searchFormRules.some((rule) => /display:\s*contents;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.search-screen-form > :is(.tds-mobile-search-field, .ait-search-field)').some((rule) => /flex:\s*1;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.search-screen-form > .tds-mobile-search-field').some((rule) => /height:\s*58px;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.search-screen-form > .tds-mobile-search-field').some((rule) => /overflow:\s*hidden;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.search-screen-top-v2 .search-screen-toolrow').some((rule) => /align-items:\s*flex-start;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.search-screen-top-v2 .search-filter-button').some((rule) => /margin-top:\s*14px;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.search-filter-button').some((rule) => /width:\s*44px;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.search-filter-button').some((rule) => /height:\s*44px;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.search-screen-v2').some((rule) => /--search-screen-inline-padding:\s*16px;/.test(rule)))
  assert.ok(topRules.some((rule) => /padding:\s*10px var\(--search-screen-inline-padding\) 4px;/.test(rule)))
  assert.ok(contentRules.some((rule) => /padding-inline:\s*var\(--search-screen-inline-padding\);/.test(rule)))
  assert.ok(contentRules.some((rule) => /padding-top:\s*8px;/.test(rule)))
})

test('SearchPage treats keyword changes as replaceable search state instead of back-stack depth', () => {
  const source = searchPageSource()

  assert.match(source, /const handleSearchBack = \(\) =>/)
  assert.match(source, /const next = writeShopFilters\(new URLSearchParams\(\), selectedFilters\)/)
  assert.match(source, /setSearchParams\(next, \{ replace: true \}\)/)
  assert.match(source, /onBack=\{handleSearchBack\}/)
})

test('SearchPage submits the TDS search field on Enter while preserving returnTo query routes', () => {
  const source = searchPageSource()

  assert.match(source, /type KeyboardEvent/)
  assert.match(source, /const handleSearchKeyDown = \(event: KeyboardEvent<HTMLInputElement>\) =>/)
  assert.match(source, /if \(event\.key !== 'Enter'\) \{[\s\S]*?return[\s\S]*?\}/)
  assert.match(source, /event\.preventDefault\(\)[\s\S]*moveToSearch\(keyword\)/)
  assert.match(source, /onKeyDown=\{handleSearchKeyDown\}/)
  assert.match(source, /next\.set\('returnTo', safeReturnTo\)/)
})

test('SearchPage renders the bundled location guide image for the empty search state', () => {
  const source = searchPageSource()
  const styles = appCssSource()
  const visualRule = cssRuleBody(styles, '.search-location-visual')
  const imageRule = cssRuleBody(styles, '.search-location-image')

  assert.match(source, /import searchLocationGuideUrl from '\.\.\/assets\/search-location-guide\.webp'/)
  assert.match(source, /내 위치에서 가까운 매장을/)
  assert.match(source, /찾아볼까요\?/)
  assert.doesNotMatch(source, /버튼을 누를 때만 위치 권한을 요청해요/)
  assert.match(source, /className="search-location-image"/)
  assert.match(source, /src=\{searchLocationGuideUrl\}/)
  assert.match(visualRule, /width:\s*min\(228px,\s*62vw\);/)
  assert.match(visualRule, /height:\s*168px;/)
  assert.match(imageRule, /width:\s*100%;/)
  assert.match(imageRule, /height:\s*100%;/)
  assert.match(imageRule, /object-fit:\s*contain;/)
  assert.match(imageRule, /object-position:\s*center bottom;/)
})

test('SearchPage recent search and empty location copy use compact mobile text rhythm', () => {
  const styles = appCssSource()
  const historyHeadRule = cssRuleBody(styles, '.search-history-head strong')
  const historyItemRules = cssRuleBodies(styles, '.search-history-item')
  const historyItemTextRule = cssRuleBody(styles, '.search-history-item strong')
  const locationCardRule = cssRuleBody(styles, '.search-location-card')
  const locationCopyRule = cssRuleBody(styles, '.search-location-copy strong')
  const locationButtonRule = cssRuleBody(styles, '.search-location-button')

  assert.match(historyHeadRule, /font-size:\s*var\(--ait-font-size-body-md\);/)
  assert.ok(historyItemRules.some((rule) => /min-height:\s*52px;/.test(rule)))
  assert.match(historyItemTextRule, /font-size:\s*var\(--ait-font-size-body-md\);/)
  assert.match(locationCardRule, /justify-content:\s*center;/)
  assert.match(locationCardRule, /min-height:\s*340px;/)
  assert.match(locationCopyRule, /font-size:\s*var\(--ait-font-size-body-lg\);/)
  assert.match(locationCopyRule, /font-weight:\s*700;/)
  assert.match(locationButtonRule, /min-width:\s*168px;/)
  assert.match(locationButtonRule, /background:\s*var\(--ait-color-brand\);/)
  assert.match(locationButtonRule, /color:\s*var\(--ait-color-text-inverse\);/)
})
