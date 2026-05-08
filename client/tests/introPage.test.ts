import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createServer, type ViteDevServer } from 'vite'

const introPageSource = () => fs.readFileSync(new URL('../src/pages/IntroPage.tsx', import.meta.url), 'utf8')
const appCssSource = () => fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')
const routerSource = () => fs.readFileSync(new URL('../src/app/router.tsx', import.meta.url), 'utf8')

let viteServer: ViteDevServer | undefined
type DomGlobalName =
  | 'window'
  | 'self'
  | 'document'
  | 'navigator'
  | 'HTMLElement'
  | 'MouseEvent'
  | 'Node'
  | 'getComputedStyle'
  | 'IS_REACT_ACT_ENVIRONMENT'

const domGlobalNames: DomGlobalName[] = [
  'window',
  'self',
  'document',
  'navigator',
  'HTMLElement',
  'MouseEvent',
  'Node',
  'getComputedStyle',
  'IS_REACT_ACT_ENVIRONMENT',
]

const loadIntroPage = async () => {
  viteServer ??= await createServer({
    appType: 'custom',
    logLevel: 'error',
    root: fileURLToPath(new URL('..', import.meta.url)),
    server: { middlewareMode: true },
  })

  return viteServer.ssrLoadModule('/src/pages/IntroPage.tsx') as Promise<{
    IntroPage: React.ComponentType
  }>
}

test.after(async () => {
  await viteServer?.close()
})

const setDomGlobal = (name: DomGlobalName, value: unknown) => {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value,
    writable: true,
  })
}

const setupDom = () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://aniwhere.test/intro',
  })
  const previousGlobals = new Map<DomGlobalName, PropertyDescriptor | undefined>(
    domGlobalNames.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
  )

  setDomGlobal('window', dom.window)
  setDomGlobal('self', dom.window)
  setDomGlobal('document', dom.window.document)
  setDomGlobal('navigator', dom.window.navigator)
  setDomGlobal('HTMLElement', dom.window.HTMLElement)
  setDomGlobal('MouseEvent', dom.window.MouseEvent)
  setDomGlobal('Node', dom.window.Node)
  setDomGlobal('getComputedStyle', dom.window.getComputedStyle.bind(dom.window))
  setDomGlobal('IS_REACT_ACT_ENVIRONMENT', true)

  return {
    container: dom.window.document.getElementById('root') as HTMLElement,
    dom,
    previousGlobals,
  }
}

const cleanupDom = (
  dom: JSDOM,
  previousGlobals: Map<DomGlobalName, PropertyDescriptor | undefined>,
  root?: Root,
) => {
  if (root != null) {
    act(() => {
      root.unmount()
    })
  }

  dom.window.close()

  for (const name of domGlobalNames) {
    const descriptor = previousGlobals.get(name)

    if (descriptor != null) {
      Object.defineProperty(globalThis, name, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, name)
    }
  }
}

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
  assert.match(source, /관심 있는 작품이 생겼나요\?/)
  assert.match(source, /관련 굿즈샵을 추천해드려요/)
  assert.match(source, /지도에서 한눈에 확인해요/)
  assert.match(source, /필터로 원하는 매장을 찾아봐요/)
  assert.match(source, /방문후기를 남겨요/)
  assert.match(source, /채택되면 포인트도 받을 수 있어요/)
  assert.doesNotMatch(source, /인기 작품별로 모아봤어요/)
  assert.doesNotMatch(source, /관련 굿즈샵을 바로 둘러봐요/)
  assert.doesNotMatch(source, /내 취향대로/)
  assert.doesNotMatch(source, /재밌게 본 작품/)
  assert.doesNotMatch(source, /좁혀봐요/)
  assert.match(source, /iconName:\s*'icon-star-mono'/)
  assert.match(source, /iconName:\s*'icon-pin-mono'/)
  assert.match(source, /iconName:\s*'icon-pencil-mono'/)
  assert.doesNotMatch(source, /<path d="M4\.5 18\.5h15" \/>/)
  assert.doesNotMatch(source, /포인트를 받아요/)
  assert.doesNotMatch(source, /운영팀 검토 후 승인 상태를 확인해요/)
})

test('IntroPage starts in home first instead of opening Toss login from intro', async () => {
  const { IntroPage } = await loadIntroPage()
  const { container, dom, previousGlobals } = setupDom()
  const root = createRoot(container)
  const styles = appCssSource()
  const actionsRule = cssRuleBody(styles, '.intro-mobile-actions')

  try {
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/intro'] },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, {
              element: React.createElement(IntroPage),
              path: '/intro',
            }),
            React.createElement(Route, {
              element: React.createElement('p', null, 'home preview'),
              path: '/home',
            }),
          ),
        ),
      )
    })

    const action = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('입장하기'),
    )

    assert.ok(action, 'primary intro action should render')

    await act(async () => {
      action.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
    })

    assert.match(container.textContent ?? '', /home preview/)
  } finally {
    cleanupDom(dom, previousGlobals, root)
  }

  assert.match(actionsRule, /align-items:\s*center;/)
})

test('IntroPage is reachable from the documented intro route', () => {
  const source = routerSource()

  assert.match(source, /path:\s*'\/intro'[\s\S]*element:\s*<IntroPage \/>/)
})

test('IntroPage paints a full white ADS viewport instead of exposing the global app background', async () => {
  const { IntroPage } = await loadIntroPage()
  const { container, dom, previousGlobals } = setupDom()
  const root = createRoot(container)
  const styles = appCssSource()
  const shellRule = cssRuleBody(styles, '.intro-mobile-shell')
  const bodyRule = cssRuleBody(styles, 'body.intro-route-body')

  try {
    await act(async () => {
      root.render(React.createElement(MemoryRouter, null, React.createElement(IntroPage)))
    })

    assert.equal(document.body.classList.contains('intro-route-body'), true)

    act(() => {
      root.unmount()
    })

    assert.equal(document.body.classList.contains('intro-route-body'), false)
  } finally {
    cleanupDom(dom, previousGlobals)
  }

  assert.match(shellRule, /width:\s*100%;/)
  assert.match(shellRule, /max-width:\s*none;/)
  assert.match(shellRule, /background:\s*var\(--ait-color-gray-0\);/)
  assert.match(bodyRule, /background:\s*var\(--ait-color-gray-0\);/)
})

test('IntroPage uses compact TDS-like top and list row text rhythm', () => {
  const styles = appCssSource()
  const titleRule = cssRuleBody(styles, '.intro-top .ait-top-copy h1')
  const accentRule = cssRuleBody(styles, '.intro-title-accent')
  const figureRule = cssRuleBody(styles, '.intro-guide-figure')
  const listRule = cssRuleBody(styles, '.intro-feature-list')
  const iconRule = cssRuleBody(styles, '.intro-feature-icon')
  const iconSvgRule = cssRuleBody(styles, '.intro-feature-icon-svg')
  const connectorRule = cssRuleBody(styles, '.intro-chain-row:not(:last-child) .ait-list-row-asset::after')
  const rowRule = cssRuleBody(styles, '.intro-feature-list .ait-list-row')
  const rowTitleRule = cssRuleBody(styles, '.intro-feature-list .ait-list-row-copy strong')
  const rowBodyRule = cssRuleBody(styles, '.intro-feature-list .ait-list-row-copy span')

  assert.match(titleRule, /font-size:\s*var\(--ait-font-size-display-md\);/)
  assert.match(titleRule, /font-weight:\s*700;/)
  assert.match(accentRule, /color:\s*var\(--ait-color-aniwhere-text-coral\);/)
  assert.match(figureRule, /height:\s*var\(--ait-component-intro-figure-height\);/)
  assert.match(listRule, /gap:\s*var\(--ait-component-intro-chain-row-gap\);/)
  assert.match(listRule, /margin:\s*var\(--ait-space-12\) var\(--ait-space-0\) var\(--ait-space-0\);/)
  assert.match(connectorRule, /height:\s*var\(--ait-component-intro-chain-connector-height\);/)
  assert.match(connectorRule, /transparent\s+var\(--ait-space-2\),\s*transparent\s+var\(--ait-space-5\)/)
  assert.match(iconRule, /width:\s*var\(--ait-component-intro-feature-asset-size\);/)
  assert.match(iconRule, /height:\s*var\(--ait-component-intro-feature-asset-size\);/)
  assert.match(iconSvgRule, /width:\s*var\(--ait-component-intro-feature-icon-size\);/)
  assert.match(iconSvgRule, /height:\s*var\(--ait-component-intro-feature-icon-size\);/)
  assert.match(iconSvgRule, /stroke-width:\s*2\.2;/)
  assert.match(rowRule, /padding:\s*var\(--ait-space-3\) var\(--ait-space-0\);/)
  assert.match(rowTitleRule, /font-size:\s*var\(--ait-font-size-title-sm\);/)
  assert.match(rowTitleRule, /font-weight:\s*600;/)
  assert.match(rowBodyRule, /font-size:\s*var\(--ait-font-size-body-md\);/)
})
