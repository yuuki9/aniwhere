import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const searchPageSource = () => fs.readFileSync(new URL('../src/pages/SearchPage.tsx', import.meta.url), 'utf8')
const shopsApiSource = () => fs.readFileSync(new URL('../src/shared/api/shops.ts', import.meta.url), 'utf8')
const apiTypesSource = () => fs.readFileSync(new URL('../src/shared/api/types.ts', import.meta.url), 'utf8')
const filterSheetSource = () => fs.readFileSync(new URL('../src/shared/ui/SearchFilterSheet.tsx', import.meta.url), 'utf8')
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
  assert.match(source, /queryKey: \['shops', 'search-page-results', currentSearchScope, currentKeyword, currentPage\]/)
  assert.match(source, /if \(currentSearchScope === 'work'\) \{[\s\S]*workKeyword: searchKeyword/)
  assert.match(source, /if \(currentSearchScope === 'work'\) \{/)
  assert.match(source, /next\.set\('scope', 'work'\)/)
  assert.match(shopsApi, /workKeyword:\s*params\.workKeyword/)
  assert.match(apiTypes, /workKeyword\?: string/)
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

  assert.match(source, /search-filter-button/)
  assert.match(source, /SearchFilterSheet/)
  assert.match(filterSheet, /search-filter-sheet/)
  assert.match(filterSheet, /filterCloseButtonRef/)
  assert.match(filterSheet, /event\.key === 'Escape'/)
  assert.match(filterSheet, /querySelectorAll<HTMLElement>/)
  assert.match(filterSheet, /선택 초기화/)
  assert.match(filterSheet, /필터 적용/)
  assert.match(filterSheet, /facet API가 연결되면/)
  assert.doesNotMatch(source, /search-page-facets/)
})

test('SearchPage search icon button follows the home header icon button touch target', () => {
  const iconRule = cssRuleBody(appCssSource(), '.search-screen-icon')

  assert.match(iconRule, /width:\s*42px;/)
  assert.match(iconRule, /height:\s*42px;/)
})

test('SearchPage header uses brand navigation and compact icon proportions', () => {
  const source = searchPageSource()
  const styles = appCssSource()
  const iconSvgRule = cssRuleBody(styles, '.search-screen-icon svg')
  const searchBarRules = cssRuleBodies(styles, '.search-screen-bar')

  assert.match(source, /<AitNavigation/)
  assert.doesNotMatch(source, /title="검색"/)
  assert.doesNotMatch(source, /search-page-titlebar/)
  assert.doesNotMatch(source, /search-mode-tabs/)
  assert.doesNotMatch(source, /search-mode-tab/)
  assert.match(source, /placeholder="매장, 지역, 작품 이름 검색"/)
  assert.match(iconSvgRule, /width:\s*22px;/)
  assert.match(iconSvgRule, /height:\s*22px;/)
  assert.ok(searchBarRules.some((rule) => /min-height:\s*42px;/.test(rule)))
  assert.ok(searchBarRules.some((rule) => /background:\s*var\(--ait-color-gray-100\);/.test(rule)))
})

test('SearchPage treats keyword changes as replaceable search state instead of back-stack depth', () => {
  const source = searchPageSource()

  assert.match(source, /const handleSearchBack = \(\) =>/)
  assert.match(source, /const next = new URLSearchParams\(\)/)
  assert.match(source, /setSearchParams\(next, \{ replace: true \}\)/)
  assert.match(source, /onBack=\{handleSearchBack\}/)
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
