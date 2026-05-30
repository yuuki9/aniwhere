import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const searchPageSource = () => fs.readFileSync(new URL('../src/pages/SearchPage.tsx', import.meta.url), 'utf8')
const mapSearchFieldShellSource = () =>
  fs.readFileSync(new URL('../src/shared/ui/MapSearchFieldShell.tsx', import.meta.url), 'utf8')
const filterSheetSource = () => fs.readFileSync(new URL('../src/shared/ui/SearchFilterSheet.tsx', import.meta.url), 'utf8')
const searchCopySource = () => fs.readFileSync(new URL('../src/shared/lib/searchCopy.ts', import.meta.url), 'utf8')
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

test('SearchPage is an input route that sends submitted searches to the explore list', () => {
  const source = searchPageSource()

  assert.match(source, /function buildExploreSearchHref/)
  assert.match(source, /next\.set\('view', 'list'\)/)
  assert.match(source, /scope === 'work'[\s\S]*next\.set\('scope', 'work'\)/)
  assert.match(source, /next\.set\('keyword', trimmed\)/)
  assert.match(source, /return `\/explore\?\$\{next\.toString\(\)\}`/)
  assert.match(source, /function readSafeReturnTo/)
  assert.match(source, /submitSearchToExplore\(keyword\)/)
  assert.match(source, /navigate\(buildExploreSearchHref\(\{ keyword: trimmed, scope: currentSearchScope, selectedFilters \}\), \{ replace: true \}\)/)
  assert.match(source, /pushRecentSearch\(trimmed\)/)
  assert.doesNotMatch(source, /getShops/)
  assert.doesNotMatch(source, /search-page-results/)
  assert.doesNotMatch(source, /search-result-list/)
  assert.doesNotMatch(source, /search-result-card/)
  assert.doesNotMatch(source, /StatusPill/)
})

test('SearchPage keeps the shared map search field shell without TDS SearchField chrome', () => {
  const source = searchPageSource()
  const shellSource = mapSearchFieldShellSource()
  const styles = appCssSource()
  const copySource = searchCopySource()

  assert.match(copySource, /SHOP_SEARCH_PLACEHOLDER = '작품, 매장명, 지역으로 검색'/)
  assert.match(source, /import \{ MapSearchFieldForm \} from '\.\.\/shared\/ui\/MapSearchFieldShell'/)
  assert.match(source, /<MapSearchFieldForm/)
  assert.doesNotMatch(source, /<MapSearchFieldForm[\s\S]*autoFocus/)
  assert.match(source, /value=\{keyword\}/)
  assert.match(source, /onChange=\{setKeyword\}/)
  assert.match(source, /onClear=\{\(\) => setKeyword\(''\)\}/)
  assert.match(shellSource, /<form className="search-screen-form search-screen-bar map-search-field" onSubmit=\{onSubmit\}>/)
  assert.match(shellSource, /<input/)
  assert.match(shellSource, /className="search-screen-input"/)
  assert.match(shellSource, /placeholder=\{SHOP_SEARCH_PLACEHOLDER\}/)
  assert.match(shellSource, /type="search"/)
  assert.match(source, /className="search-filter-button map-filter-button"/)
  assert.doesNotMatch(source, /import \{ SearchField \} from '@aniwhere\/tds-mobile'/)
  assert.doesNotMatch(source, /<SearchField/)
  assert.ok(cssRuleBodies(styles, '.search-screen-form.map-search-field .search-screen-input::-webkit-search-cancel-button').some((rule) => /display:\s*none;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.search-screen-form.map-search-field .search-screen-input::-webkit-search-decoration').some((rule) => /display:\s*none;/.test(rule)))
})

test('SearchPage uses the explore list route shell instead of a dedicated search screen surface', () => {
  const source = searchPageSource()
  const styles = appCssSource()

  assert.match(source, /<main className="map-page-shell">/)
  assert.match(source, /className="map-page map-page-list-mode"/)
  assert.match(source, /className="map-list-view/)
  assert.match(source, /<div className="map-list-view-top">/)
  assert.match(source, /<section className="map-results-list-panel"/)
  assert.doesNotMatch(source, /className="search-result-head"/)
  assert.doesNotMatch(source, /className="search-screen-shell"/)
  assert.doesNotMatch(source, /className="search-screen search-screen-v2"/)
  assert.doesNotMatch(source, /className="search-screen-top search-screen-top-v2"/)
  assert.doesNotMatch(source, /className="search-screen-content search-screen-content-v2"/)
  assert.doesNotMatch(styles, /\.search-screen-v2\s*\{/)
  assert.doesNotMatch(styles, /\.search-screen-top-v2\s*\{/)
  assert.doesNotMatch(styles, /\.search-screen-content-v2\s*\{/)
  assert.doesNotMatch(styles, /\.search-screen-shell\b/)
  assert.doesNotMatch(styles, /\.search-route-navigation\b/)
})

test('SearchPage preserves filter editing but leaves selected filter chips to explore results', () => {
  const source = searchPageSource()
  const filterSheet = filterSheetSource()

  assert.match(source, /parseShopFilters\(searchParams\)/)
  assert.match(source, /countShopFilters\(selectedFilters\)/)
  assert.match(source, /navigate\(buildExploreSearchHref\(\{ keyword, scope: currentSearchScope, selectedFilters: nextFilters \}\), \{ replace: true \}\)/)
  assert.match(source, /<SearchFilterSheet/)
  assert.match(source, /selectedFilters=\{selectedFilters\}/)
  assert.match(source, /onApplyFilters=\{applyFilters\}/)
  assert.doesNotMatch(source, /setSearchParams\(writeShopFilters\(searchParams, nextFilters\)/)
  assert.doesNotMatch(source, /AppliedFilterChips/)
  assert.match(filterSheet, /const facetParams = \{ includeRegions: true, includeCategories: true, includeWorkTypes: true, includeSorts: true \}/)
})

test('SearchPage back action returns to the safe caller route before falling back to history', () => {
  const source = searchPageSource()

  assert.match(source, /const safeReturnTo = readSafeReturnTo\(searchParams\.get\('returnTo'\)\)/)
  assert.match(source, /if \(safeReturnTo\) \{[\s\S]*navigate\(safeReturnTo, \{ replace: true \}\)/)
  assert.match(source, /navigate\(-1\)/)
  assert.doesNotMatch(source, /setSearchParams\(next, \{ replace: true \}\)[\s\S]*setKeyword\(''\)/)
})

test('SearchPage recent searches and nearby CTA remain the pre-search content', () => {
  const source = searchPageSource()

  assert.match(source, /readRecentSearches/)
  assert.match(source, /removeRecentSearch/)
  assert.match(source, /clearRecentSearches/)
  assert.match(source, /recentSearches\.map/)
  assert.match(source, /className="search-history-chip-list"/)
  assert.match(source, /className="search-history-clear-all"/)
  assert.match(source, /className="search-history-chip"/)
  assert.match(source, /className="search-history-chip-remove applied-filter-chip-close"/)
  assert.match(source, /onClick=\{\(\) => submitSearchToExplore\(item\)\}/)
  assert.match(source, /onClick=\{\(\) => removeRecentSearchItem\(item\)\}/)
  assert.match(source, /onClick=\{clearAllRecentSearches\}/)
  assert.doesNotMatch(source, /className="search-history-list"/)
  assert.doesNotMatch(source, /className="search-history-item"/)
  assert.match(source, /requestCurrentLocation/)
  assert.match(source, /buildNearbyExploreHref/)
  assert.match(source, /className="search-location-image"/)
  assert.match(source, /src=\{searchLocationGuideUrl\}/)
})

test('SearchPage recent search and empty location copy use compact mobile text rhythm', () => {
  const styles = appCssSource()
  const historyHeadRule = cssRuleBody(styles, '.search-history-head strong')
  const historyChipListRules = cssRuleBodies(styles, '.search-history-chip-list')
  const historyChipRules = cssRuleBodies(styles, '.search-history-chip')
  const historyChipLabelRule = cssRuleBody(styles, '.search-history-chip-label')
  const historyChipRemoveRule = cssRuleBody(styles, '.search-history-chip-remove')
  const precontentRule = cssRuleBody(styles, '.map-results-sheet-list.search-route-precontent')
  const locationCardRule = cssRuleBody(styles, '.search-location-card')
  const locationCopyRule = cssRuleBody(styles, '.search-location-copy strong')
  const locationButtonRule = cssRuleBody(styles, '.search-location-button')

  assert.match(historyHeadRule, /font-size:\s*var\(--ait-font-size-body-md\);/)
  assert.ok(historyChipListRules.some((rule) => /flex-wrap:\s*wrap;/.test(rule)))
  assert.ok(historyChipRules.some((rule) => /min-height:\s*40px;/.test(rule)))
  assert.match(historyChipLabelRule, /font-size:\s*var\(--ait-font-size-body-md\);/)
  assert.match(historyChipRemoveRule, /font-size:\s*12px;/)
  assert.match(precontentRule, /gap:\s*var\(--ait-space-12\);/)
  assert.match(locationCardRule, /justify-content:\s*center;/)
  assert.match(locationCardRule, /min-height:\s*340px;/)
  assert.match(locationCopyRule, /font-size:\s*var\(--ait-font-size-body-lg\);/)
  assert.match(locationCopyRule, /font-weight:\s*700;/)
  assert.match(locationButtonRule, /min-width:\s*168px;/)
  assert.match(locationButtonRule, /background:\s*var\(--ait-color-brand\);/)
  assert.match(locationButtonRule, /color:\s*var\(--ait-color-text-inverse\);/)
})
