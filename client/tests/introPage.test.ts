import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const introPageSource = () => fs.readFileSync(new URL('../src/pages/IntroPage.tsx', import.meta.url), 'utf8')
const appCssSource = () => fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

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

test('IntroPage leads with shop discovery and keeps rewards as a secondary outcome', () => {
  const source = introPageSource()

  assert.match(source, /가까운 피규어·가챠샵,/)
  assert.match(source, /이제 한 번에 찾아보세요/)
  assert.match(source, /흩어진 굿즈샵 정보를 지도에서 확인하고,/)
  assert.match(source, /방문 후기와 팁까지 함께 볼 수 있어요\./)
  assert.match(source, /찾기부터 방문 기록까지/)
  assert.match(source, /피규어·가챠·굿즈샵을 지도에서 확인해요/)
  assert.match(source, /재고, 위치, 분위기 정보를 미리 살펴봐요/)
  assert.match(source, /다녀온 정보를 공유하고 포인트를 받아요/)
  assert.doesNotMatch(source, /취향/)
  assert.doesNotMatch(source, /검토 승인/)
  assert.doesNotMatch(source, /운영팀 검토 후 승인 상태를 확인해요\./)
})

test('IntroPage starts in home first instead of opening Toss login from intro', () => {
  const source = introPageSource()
  const styles = appCssSource()
  const actionsRule = cssRuleBody(styles, '.intro-mobile-actions')

  assert.match(source, /navigate\('\/home'/)
  assert.match(source, /매장 찾기 시작하기/)
  assert.doesNotMatch(source, /startServiceEntry/)
  assert.doesNotMatch(source, /토스로 시작하기/)
  assert.doesNotMatch(source, /로그인 준비 중/)
  assert.doesNotMatch(source, /intro-secondary-action/)
  assert.match(actionsRule, /align-items:\s*center;/)
})

test('IntroPage paints a full white ADS viewport instead of exposing the global app background', () => {
  const source = introPageSource()
  const styles = appCssSource()
  const shellRule = cssRuleBody(styles, '.intro-mobile-shell')
  const bodyRule = cssRuleBody(styles, 'body.intro-route-body')

  assert.match(source, /document\.body\.classList\.add\('intro-route-body'\)/)
  assert.match(shellRule, /width:\s*100%;/)
  assert.match(shellRule, /max-width:\s*none;/)
  assert.match(shellRule, /background:\s*var\(--ait-color-gray-0\);/)
  assert.match(bodyRule, /background:\s*var\(--ait-color-gray-0\);/)
})

test('IntroPage uses compact TDS-like top and list row text rhythm', () => {
  const styles = appCssSource()
  const titleRule = cssRuleBody(styles, '.intro-top .ait-top-copy h1')
  const subtitleRule = cssRuleBody(styles, '.intro-top .ait-top-copy p')
  const flowTitleRule = cssRuleBody(styles, '.intro-flow-title')
  const rowRule = cssRuleBody(styles, '.intro-feature-list .ait-list-row')
  const rowTitleRule = cssRuleBody(styles, '.intro-feature-list .ait-list-row-copy strong')
  const rowBodyRule = cssRuleBody(styles, '.intro-feature-list .ait-list-row-copy span')

  assert.match(titleRule, /font-size:\s*var\(--ait-font-size-display-sm\);/)
  assert.match(titleRule, /font-weight:\s*700;/)
  assert.match(subtitleRule, /font-size:\s*var\(--ait-font-size-body-lg\);/)
  assert.match(flowTitleRule, /font-size:\s*var\(--ait-font-size-body-lg\);/)
  assert.match(flowTitleRule, /font-weight:\s*700;/)
  assert.match(rowRule, /padding:\s*var\(--ait-space-4\) var\(--ait-space-0\);/)
  assert.match(rowTitleRule, /font-size:\s*var\(--ait-font-size-body-lg\);/)
  assert.match(rowTitleRule, /font-weight:\s*600;/)
  assert.match(rowBodyRule, /font-size:\s*var\(--ait-font-size-body-md\);/)
})
