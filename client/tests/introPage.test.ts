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

test('IntroPage explains Aniwhere through curation, map exploration, and review retention', () => {
  const source = introPageSource()

  assert.match(source, /흩어진 굿즈샵 정보,/)
  assert.match(source, /애니웨어<\/span>에 모아뒀어요/)
  assert.match(source, /인기 작품 큐레이션부터!/)
  assert.match(source, /포스터와 트렌드 기준으로 둘러봐요/)
  assert.match(source, /지도와 필터로 빠르게!/)
  assert.match(source, /가까운 굿즈샵과 방문 정보를 확인해요/)
  assert.match(source, /방문 후기도 이어서!/)
  assert.match(source, /채택되면 포인트도 받을 수 있어요/)
  assert.doesNotMatch(source, /포인트를 받아요/)
  assert.doesNotMatch(source, /운영팀 검토 후 승인 상태를 확인해요/)
})

test('IntroPage starts in home first instead of opening Toss login from intro', () => {
  const source = introPageSource()
  const styles = appCssSource()
  const actionsRule = cssRuleBody(styles, '.intro-mobile-actions')

  assert.match(source, /navigate\('\/home'/)
  assert.match(source, /매장 둘러보기/)
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
  const accentRule = cssRuleBody(styles, '.intro-title-accent')
  const listRule = cssRuleBody(styles, '.intro-feature-list')
  const rowRule = cssRuleBody(styles, '.intro-feature-list .ait-list-row')
  const rowTitleRule = cssRuleBody(styles, '.intro-feature-list .ait-list-row-copy strong')
  const rowBodyRule = cssRuleBody(styles, '.intro-feature-list .ait-list-row-copy span')

  assert.match(titleRule, /font-size:\s*var\(--ait-font-size-display-md\);/)
  assert.match(titleRule, /font-weight:\s*700;/)
  assert.match(accentRule, /color:\s*var\(--ait-color-aniwhere-icon-coral\);/)
  assert.match(listRule, /gap:\s*var\(--ait-space-5\);/)
  assert.match(rowRule, /padding:\s*var\(--ait-space-3\) var\(--ait-space-0\);/)
  assert.match(rowTitleRule, /font-size:\s*var\(--ait-font-size-title-sm\);/)
  assert.match(rowTitleRule, /font-weight:\s*600;/)
  assert.match(rowBodyRule, /font-size:\s*var\(--ait-font-size-body-md\);/)
})
