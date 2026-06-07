import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const trendsPageSource = () => fs.readFileSync(new URL('../src/pages/TrendsPage.tsx', import.meta.url), 'utf8')
const appCssSource = () => fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

function cssRuleBodies(css: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = css.matchAll(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'g'))

  return Array.from(matches, (match) => match[1])
}

test('TrendsPage keeps the dormant full ranking board route available', () => {
  const source = trendsPageSource()

  assert.match(source, /<h1 id="trends-title">지금 뜨는 애니웨어<\/h1>/)
  assert.match(source, /<span className="trends-period-chip">7일 기준<\/span>/)
  assert.match(source, /aria-label="애니웨어 랭킹 보기"/)
  assert.match(source, /label: '전체'/)
  assert.match(source, /label: '작품'/)
  assert.match(source, /label: '매장'/)
  assert.match(source, /label: '검색어'/)
  assert.match(source, /aria-label="지금 뜨는 애니웨어 Top20"/)
  assert.match(source, /to=\{buildTrendExploreHref\(item, \{ returnTo: '\/trends' \}\)\}/)
  assert.doesNotMatch(source, /실시간|급상승|핫|판매|가격|price|sold/i)
})

test('TrendsPage ranking board keeps a plain mobile ListRow rhythm', () => {
  const styles = appCssSource()
  const boardStyles = [
    ...cssRuleBodies(styles, '.trends-head'),
    ...cssRuleBodies(styles, '.trends-list-card'),
    ...cssRuleBodies(styles, '.trends-list-row'),
  ].join('\n')

  assert.ok(cssRuleBodies(styles, '.trends-head').some((rule) => /display:\s*flex;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.trends-head').some((rule) => /justify-content:\s*space-between;/.test(rule)))
  assert.match(styles, /\.trends-period-chip\s*\{[\s\S]*border-radius:\s*var\(--ait-radius-full\);/)
  assert.match(styles, /\.trends-list-row\s*\{[\s\S]*min-height: 58px;/)
  assert.match(styles, /\.trends-list-row\s*\{[\s\S]*grid-template-columns: 32px minmax\(0, 1fr\) 48px;/)
  assert.doesNotMatch(boardStyles, /box-shadow|linear-gradient|coverUrl|coverImage|bannerImage/)
})
