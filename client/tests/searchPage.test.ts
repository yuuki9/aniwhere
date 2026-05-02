import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const searchPageSource = () => fs.readFileSync(new URL('../src/pages/SearchPage.tsx', import.meta.url), 'utf8')

test('SearchPage does not build recommendations by fetching an aggregate shop page', () => {
  const source = searchPageSource()

  assert.doesNotMatch(source, /search-page-facets/)
  assert.doesNotMatch(source, /getShops\(\{\s*page:\s*0,\s*size:\s*200/)
  assert.doesNotMatch(source, /quickKeywords/)
})

test('SearchPage renders shop results from API fields without inferred fallback copy', () => {
  const source = searchPageSource()

  assert.match(source, /keyword:\s*currentKeyword \|\| undefined/)
  assert.doesNotMatch(source, /regionId \?\? '-'/)
  assert.doesNotMatch(source, /shop\.works\.length/)
  assert.doesNotMatch(source, /작품 \{shop\.works\.length\}/)
})

test('SearchPage exposes an explicit nearby CTA through geolocation instead of silent permission prompts', () => {
  const source = searchPageSource()

  assert.match(source, /requestCurrentLocation/)
  assert.match(source, /buildNearbyExploreHref/)
  assert.match(source, /내 위치에서 가까운 매장을/)
  assert.match(source, /찾아볼까요\?/)
  assert.match(source, /가까운 매장 찾기/)
  assert.doesNotMatch(source, /버튼을 누를 때만 위치 권한을 요청해요/)
  assert.doesNotMatch(source, /useEffect\([^]*requestCurrentLocation/)
})

test('SearchPage has a filter button and bottom sheet shell without client-side facet generation', () => {
  const source = searchPageSource()

  assert.match(source, /search-filter-button/)
  assert.match(source, /search-filter-sheet/)
  assert.match(source, /선택 초기화/)
  assert.match(source, /필터 적용/)
  assert.match(source, /facet API가 연결되면/)
  assert.doesNotMatch(source, /search-page-facets/)
})

test('SearchPage search icon button follows the home header icon button touch target', () => {
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(styles, /\.search-screen-icon\s*\{[^}]*width:\s*42px;[^}]*height:\s*42px;/s)
})

test('SearchPage header uses a single search title with compact icon proportions', () => {
  const source = searchPageSource()
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(source, /className="search-page-title">검색/)
  assert.doesNotMatch(source, /search-mode-tabs/)
  assert.doesNotMatch(source, /search-mode-tab/)
  assert.match(source, /placeholder="매장, 지역, 작품 이름 검색"/)
  assert.match(styles, /\.search-page-title\s*\{[^}]*font-size:\s*var\(--ait-font-size-body-lg\);/s)
  assert.match(styles, /\.search-screen-icon svg\s*\{[^}]*width:\s*22px;[^}]*height:\s*22px;/s)
  assert.match(styles, /\.search-screen-bar\s*\{[^}]*min-height:\s*42px;[^}]*background:\s*var\(--ait-color-gray-100\);/s)
})

test('SearchPage treats keyword changes as replaceable search state instead of back-stack depth', () => {
  const source = searchPageSource()

  assert.match(source, /const handleSearchBack = \(\) =>/)
  assert.match(source, /setSearchParams\(new URLSearchParams\(\), \{ replace: true \}\)/)
  assert.match(source, /setSearchParams\(next, \{ replace: true \}\)/)
  assert.match(source, /onClick=\{handleSearchBack\}/)
})

test('SearchPage renders the bundled location guide image for the empty search state', () => {
  const source = searchPageSource()
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(source, /import searchLocationGuideUrl from '\.\.\/assets\/search-location-guide\.webp'/)
  assert.match(source, /내 위치에서 가까운 매장을/)
  assert.match(source, /찾아볼까요\?/)
  assert.doesNotMatch(source, /버튼을 누를 때만 위치 권한을 요청해요/)
  assert.match(source, /className="search-location-image"/)
  assert.match(source, /src=\{searchLocationGuideUrl\}/)
  assert.match(styles, /\.search-location-visual\s*\{[^}]*width:\s*min\(228px,\s*62vw\);[^}]*height:\s*168px;/s)
  assert.match(styles, /\.search-location-image\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*contain;[^}]*object-position:\s*center bottom;/s)
})

test('SearchPage recent search and empty location copy use compact mobile text rhythm', () => {
  const styles = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(styles, /\.search-history-head strong\s*\{[^}]*font-size:\s*var\(--ait-font-size-body-md\);/s)
  assert.match(styles, /\.search-history-item\s*\{[^}]*min-height:\s*52px;/s)
  assert.match(styles, /\.search-history-item strong\s*\{[^}]*font-size:\s*var\(--ait-font-size-body-md\);/s)
  assert.match(styles, /\.search-location-card\s*\{[^}]*justify-content:\s*center;[^}]*min-height:\s*340px;/s)
  assert.match(styles, /\.search-location-copy strong\s*\{[^}]*font-size:\s*var\(--ait-font-size-body-lg\);[^}]*font-weight:\s*700;/s)
  assert.match(styles, /\.search-location-button\s*\{[^}]*min-width:\s*168px;[^}]*background:\s*var\(--ait-color-brand\);[^}]*color:\s*var\(--ait-color-text-inverse\);/s)
})
