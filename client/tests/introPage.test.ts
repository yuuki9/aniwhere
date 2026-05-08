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
  assert.match(source, /인기 작품별로 모아봤어요/)
  assert.match(source, /관련 굿즈샵을 바로 둘러봐요/)
  assert.match(source, /지도에서 한눈에 확인해요/)
  assert.match(source, /필터로 원하는 매장을 찾아봐요/)
  assert.match(source, /후기를 남겨요/)
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
  const iconRule = cssRuleBody(styles, '.intro-feature-icon')
  const iconSvgRule = cssRuleBody(styles, '.intro-feature-icon-svg')
  const rowRule = cssRuleBody(styles, '.intro-feature-list .ait-list-row')
  const rowTitleRule = cssRuleBody(styles, '.intro-feature-list .ait-list-row-copy strong')
  const rowBodyRule = cssRuleBody(styles, '.intro-feature-list .ait-list-row-copy span')

  assert.match(titleRule, /font-size:\s*var\(--ait-font-size-display-md\);/)
  assert.match(titleRule, /font-weight:\s*700;/)
  assert.match(accentRule, /color:\s*var\(--ait-color-aniwhere-icon-coral\);/)
  assert.match(listRule, /gap:\s*var\(--ait-space-5\);/)
  assert.match(iconRule, /width:\s*52px;/)
  assert.match(iconRule, /height:\s*52px;/)
  assert.match(iconSvgRule, /width:\s*27px;/)
  assert.match(iconSvgRule, /height:\s*27px;/)
  assert.match(iconSvgRule, /stroke-width:\s*2\.4;/)
  assert.match(rowRule, /padding:\s*var\(--ait-space-3\) var\(--ait-space-0\);/)
  assert.match(rowTitleRule, /font-size:\s*var\(--ait-font-size-title-sm\);/)
  assert.match(rowTitleRule, /font-weight:\s*600;/)
  assert.match(rowBodyRule, /font-size:\s*var\(--ait-font-size-body-md\);/)
})
