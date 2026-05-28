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
const tdsPublicSource = () => fs.readFileSync(new URL('../src/shared/ui/tdsMobile/public.tsx', import.meta.url), 'utf8')

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
    mode: 'public',
    root: fileURLToPath(new URL('..', import.meta.url)),
    server: { middlewareMode: true },
  })

  return viteServer.ssrLoadModule('/src/pages/IntroPage.tsx') as Promise<{
    IntroPage: React.ComponentType
  }>
}

const loadTdsPublic = async () => {
  viteServer ??= await createServer({
    appType: 'custom',
    logLevel: 'error',
    mode: 'public',
    root: fileURLToPath(new URL('..', import.meta.url)),
    server: { middlewareMode: true },
  })

  return viteServer.ssrLoadModule('/src/shared/ui/tdsMobile/public.tsx') as Promise<{
    ListRow: React.ComponentType<{
      left?: React.ReactNode
      contents?: React.ReactNode
      right?: React.ReactNode
    }>
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
  assert.match(source, /intro-chain-row-\$\{item\.icon\}/)
  assert.doesNotMatch(source, /ait-list-row/)
  assert.doesNotMatch(source, /<path d="M4\.5 18\.5h15" \/>/)
  assert.doesNotMatch(source, /포인트를 받아요/)
  assert.doesNotMatch(source, /운영팀 검토 후 승인 상태를 확인해요/)
})

test('IntroPage does not enter home without completing Toss login', async () => {
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

    assert.doesNotMatch(container.textContent ?? '', /home preview/)
    assert.match(container.textContent ?? '', /토스 앱에서 로그인해 주세요/)
  } finally {
    cleanupDom(dom, previousGlobals, root)
  }

  assert.match(introPageSource(), /display="block"/)
  assert.doesNotMatch(introPageSource(), /display="full"/)
  assert.match(actionsRule, /align-items:\s*center;/)
})

test('IntroPage offers a nickname setup mock entry while Toss login is blocked', () => {
  const source = introPageSource()

  assert.match(source, /닉네임 설정하고 입장/)
  assert.match(source, /const handleMockNicknameStart = \(\) => \{\s*if \(isEntryAttemptInFlightRef\.current \|\| isEntering\)/)
  assert.match(source, /className="intro-login-skip-button"[\s\S]*disabled=\{isEntering\}/)
  assert.match(source, /setIsMockNicknameOnboardingOpen\(true\)/)
  assert.match(source, /open=\{isNicknameSheetOpen\}/)
  assert.match(source, /pendingNicknameSession == null && isMockNicknameOnboardingOpen/)
  assert.doesNotMatch(source, /로그인 없이 둘러보기/)
  assert.doesNotMatch(source, /임시 확인용 진입점/)
  assert.doesNotMatch(source, /홈에서 ADS UI 확인하기/)
})

test('IntroPage keeps temporary preview-only routes out of the login surface', () => {
  const source = introPageSource()

  assert.doesNotMatch(source, /showIntroUiPreview/)
  assert.doesNotMatch(source, /intro-preview-actions/)
  assert.doesNotMatch(source, /임시 확인용 진입점/)
  assert.doesNotMatch(source, /홈에서 ADS UI 확인하기/)
  assert.doesNotMatch(source, /navigate\('\/explore'\)/)
  assert.doesNotMatch(source, /returnTo: '\/intro'/)
})

test('IntroPage bridges Toss login through the Aniwhere server before entering home', () => {
  const source = introPageSource()

  assert.match(source, /completeServiceEntry\(entry\)/)
  assert.match(source, /result\.mode === 'needsNickname'/)
  assert.match(source, /setPendingNicknameSession\(result\.session\)/)
  assert.match(source, /entryMode:\s*'toss'/)
  assert.match(source, /welcomeNickname:\s*result\.user\.nickname/)
})

test('IntroPage blocks concurrent login attempts before requesting a Toss authorization code', () => {
  const source = introPageSource()

  assert.match(source, /useRef/)
  assert.match(source, /isEntryAttemptInFlightRef\.current/)
  assert.match(source, /if\s*\(\s*isEntryAttemptInFlightRef\.current\s*\)\s*\{\s*return\s*\}/)
})

test('IntroPage keeps ADS login debug details out of the visible surface', () => {
  const source = introPageSource()
  const styles = appCssSource()

  assert.doesNotMatch(source, /type AuthDebugSnapshot/)
  assert.doesNotMatch(source, /IntroAuthDebugPanel/)
  assert.doesNotMatch(source, /AuthDebugEntry/)
  assert.doesNotMatch(source, /toMaskedAuthorizationCode/)
  assert.doesNotMatch(source, /normalizeTossLoginReferrerForServer/)
  assert.doesNotMatch(source, /ADS login debug/)
  assert.doesNotMatch(source, /appLogin result/)
  assert.doesNotMatch(source, /server login payload/)
  assert.doesNotMatch(styles, /\.intro-auth-debug-panel/)
  assert.doesNotMatch(styles, /\.intro-auth-debug-code/)
  assert.doesNotMatch(source, /entry\.authorizationCode\}/)
})

test('IntroPage renders a nickname setup step for new or unnamed Aniwhere users', () => {
  const source = introPageSource()
  const styles = appCssSource()

  assert.match(source, /nicknameInput/)
  assert.match(source, /saveAniwhereNickname\(nickname,\s*pendingNicknameSession\.accessToken\)/)
  assert.match(source, /import \{ Asset, BottomSheet, Button, TextField \} from '@aniwhere\/tds-mobile'/)
  assert.match(source, /const profileEmojiOptions = \[/)
  assert.match(source, /DEFAULT_PROFILE_EMOJI_ID = 'alien'/)
  assert.match(source, /PROFILE_EMOJI_RAIL_FRAME/)
  assert.match(source, /id: 'game'/)
  assert.match(source, /<BottomSheet/)
  assert.match(source, /<BottomSheet\.Header className="intro-nickname-sheet-title">/)
  assert.match(source, /className="intro-nickname-sheet"/)
  assert.match(source, /애니웨어에서 사용할 닉네임이 필요해요/)
  assert.match(source, /intro-profile-emoji-panel/)
  assert.match(source, /role="radiogroup"/)
  assert.match(source, /role="radio"/)
  assert.match(source, /Asset\.Image/)
  assert.doesNotMatch(source, /intro-profile-emoji-preview/)
  assert.match(source, /frameShape=\{isSelected \? PROFILE_EMOJI_FRAME : PROFILE_EMOJI_RAIL_FRAME\}/)
  assert.match(source, /welcomeEmoji:\s*selectedProfileEmoji\.symbol/)
  assert.match(source, /<TextField/)
  assert.match(source, /hasError=\{hasError\}/)
  assert.match(source, /help=\{fieldHelp\}/)
  assert.match(source, /NICKNAME_REQUIRED_MESSAGE = '닉네임을 한 글자 이상 입력해 주세요\.'/)
  assert.match(source, /label="닉네임"/)
  assert.match(source, /확인/)
  assert.match(source, /welcomeNickname:\s*user\.nickname \?\? nickname/)
  assert.match(source, /welcomeNickname:\s*nickname/)
  assert.doesNotMatch(source, /<input\s*[\s\S]*className="intro-nickname-input"/)
  assert.match(source, /inputMode="text"/)
  assert.match(source, /maxLength=\{50\}/)
  assert.match(cssRuleBody(styles, '.ait-bottom-sheet-dimmer'), /position:\s*fixed;/)
  assert.match(cssRuleBody(styles, '.ait-bottom-sheet'), /bottom:\s*0;/)
  assert.match(cssRuleBody(styles, '.ait-bottom-sheet'), /border-radius:\s*var\(--ait-radius-xl\)/)
  assert.match(cssRuleBody(styles, '.intro-nickname-sheet'), /display:\s*grid;/)
  assert.match(cssRuleBody(styles, '.ait-bottom-sheet-header'), /font-size:\s*var\(--ait-font-size-title-md\);/)
  assert.match(cssRuleBody(styles, '.intro-nickname-card'), /display:\s*grid;/)
  assert.match(cssRuleBody(styles, '.intro-profile-emoji-panel'), /min-width:\s*0;/)
  assert.match(cssRuleBody(styles, '.intro-profile-emoji-options'), /display:\s*flex;/)
  assert.match(cssRuleBody(styles, '.intro-profile-emoji-options'), /overflow-x:\s*auto;/)
  assert.match(cssRuleBody(styles, '.intro-profile-emoji-options'), /min-height:\s*72px;/)
  assert.match(cssRuleBody(styles, '.intro-profile-emoji-options'), /justify-content:\s*flex-start;/)
  assert.match(cssRuleBody(styles, '.intro-profile-emoji-option'), /flex:\s*0 0 48px;/)
  assert.match(cssRuleBody(styles, '.intro-profile-emoji-option'), /height:\s*48px;/)
  assert.match(cssRuleBody(styles, '.intro-profile-emoji-option'), /outline:\s*2px solid transparent;/)
  assert.match(cssRuleBody(styles, ".intro-profile-emoji-option[data-selected='true']"), /flex-basis:\s*72px;/)
  assert.match(cssRuleBody(styles, ".intro-profile-emoji-option[data-selected='true']"), /height:\s*72px;/)
  assert.match(cssRuleBody(styles, ".intro-profile-emoji-option[data-selected='true']"), /outline-color:\s*var\(--ait-color-brand\);/)
  assert.match(cssRuleBody(styles, '.intro-nickname-card .ait-text-field-input'), /min-height:\s*52px;/)
  assert.doesNotMatch(source, /프로필 설정/)
  assert.doesNotMatch(source, /닉네임 정하기/)
  assert.doesNotMatch(source, /저장 전에 중복 여부를 확인해요/)
  assert.doesNotMatch(source, /환영합니다/)
  assert.doesNotMatch(source, /confetti-spot\.json/)
  assert.doesNotMatch(source, /토스 로그인은 완료됐어요/)
})

test('IntroPage opens the shared nickname bottom sheet from the ADS mock entry', async () => {
  const { IntroPage } = await loadIntroPage()
  const { container, dom, previousGlobals } = setupDom()
  const root = createRoot(container)

  try {
    await act(async () => {
      root.render(React.createElement(MemoryRouter, null, React.createElement(IntroPage)))
    })

    const mockEntry = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('닉네임 설정하고 입장'),
    )

    assert.ok(mockEntry, 'mock nickname entry should render')

    await act(async () => {
      mockEntry.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
    })

    assert.match(container.textContent ?? '', /애니웨어에서 사용할 닉네임이 필요해요/)
    assert.match(container.textContent ?? '', /닉네임/)
    assert.match(container.textContent ?? '', /확인/)
    assert.equal(container.querySelectorAll('.intro-profile-emoji-option').length, 9)
    assert.ok(container.querySelector('.intro-profile-emoji-option[data-selected="true"]'))
    assert.ok(container.querySelector('.intro-nickname-sheet'), 'shared nickname bottom sheet should open')
    assert.equal(container.querySelector<HTMLInputElement>('#intro-nickname')?.value, '')
  } finally {
    cleanupDom(dom, previousGlobals, root)
  }
})

test('TDS public fallback preserves rounded block button behavior', () => {
  const source = tdsPublicSource()

  assert.match(source, /display !== 'inline' \? 'ait-button-full'/)
  assert.match(source, /data-color=\{color\}/)
  assert.match(source, /data-display=\{display\}/)
  assert.match(source, /data-size=\{size\}/)
  assert.match(source, /data-variant=\{variant\}/)
  assert.doesNotMatch(source, /void horizontalPadding/)
  assert.doesNotMatch(source, /void verticalPadding/)
  assert.doesNotMatch(source, /void lowerGap/)
  assert.doesNotMatch(source, /void upperGap/)
})

test('TDS public ListRow renders zero and empty string slots', async () => {
  const { ListRow } = await loadTdsPublic()
  const { container, dom, previousGlobals } = setupDom()
  const root = createRoot(container)

  try {
    await act(async () => {
      root.render(React.createElement('ul', null, React.createElement(ListRow, { left: 0, contents: '', right: 0 })))
    })

    assert.equal(container.querySelector('.ait-list-row-asset')?.textContent, '0')
    assert.ok(container.querySelector('.ait-list-row-copy'), 'empty contents should keep the copy slot')
    assert.equal(container.querySelector('.ait-list-row-right')?.textContent, '0')
  } finally {
    cleanupDom(dom, previousGlobals, root)
  }
})

test('IntroPage is reachable from the documented intro route', () => {
  const source = routerSource()

  assert.match(
    source,
    /\{[^{}]*(?:path:\s*['"]\/intro['"][^{}]*element:\s*routeElement\(<IntroPage\s*\/>\)|element:\s*routeElement\(<IntroPage\s*\/>\)[^{}]*path:\s*['"]\/intro['"])[^{}]*\}/,
  )
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
  assert.match(shellRule, /var\(--ait-space-14\)/)
  assert.match(shellRule, /background:\s*var\(--ait-color-gray-0\);/)
  assert.match(bodyRule, /background:\s*var\(--ait-color-gray-0\);/)
})

test('IntroPage preserves the domain intro feature-list rhythm', () => {
  const styles = appCssSource()
  const titleRule = cssRuleBody(styles, '.intro-top-title')
  const accentRule = cssRuleBody(styles, '.intro-title-accent')
  const figureRule = cssRuleBody(styles, '.intro-guide-figure')
  const listRule = cssRuleBody(styles, '.intro-feature-list')
  const iconRule = cssRuleBodies(styles, '.intro-feature-icon').at(-1) ?? ''
  const iconImageRule = cssRuleBody(styles, '.intro-feature-icon-image')
  const connectorRule = cssRuleBody(styles, '.intro-chain-row:not(:last-child) .intro-feature-asset::after')
  const rowRule = cssRuleBody(styles, '.intro-feature-list .intro-chain-row')
  const rowTitleRule = cssRuleBody(styles, '.intro-feature-copy strong')
  const curationRowTitleRule = cssRuleBody(styles, '.intro-chain-row-curation .intro-feature-copy strong')
  const rowBodyRule = cssRuleBody(styles, '.intro-feature-copy span')

  assert.match(titleRule, /font-size:\s*var\(--ait-font-size-display-md\);/)
  assert.match(titleRule, /font-weight:\s*700;/)
  assert.match(accentRule, /color:\s*var\(--ait-color-aniwhere-text-coral\);/)
  assert.match(accentRule, /var\(--ait-color-intro-title-highlight\)/)
  assert.match(accentRule, /font-weight:\s*800;/)
  assert.match(figureRule, /height:\s*var\(--ait-component-intro-figure-height\);/)
  assert.match(listRule, /gap:\s*var\(--ait-component-intro-chain-row-gap\);/)
  assert.match(listRule, /margin:\s*var\(--ait-space-12\) var\(--ait-space-0\) var\(--ait-space-0\);/)
  assert.match(connectorRule, /height:\s*var\(--ait-component-intro-chain-connector-height\);/)
  assert.match(connectorRule, /repeating-linear-gradient\(/)
  assert.match(connectorRule, /transparent\s+var\(--ait-space-2\),\s*transparent\s+var\(--ait-space-5\)/)
  assert.match(iconRule, /width:\s*var\(--ait-component-intro-feature-asset-size\);/)
  assert.match(iconRule, /height:\s*var\(--ait-component-intro-feature-asset-size\);/)
  assert.match(iconImageRule, /width:\s*var\(--ait-component-intro-feature-icon-size\);/)
  assert.match(iconImageRule, /height:\s*var\(--ait-component-intro-feature-icon-size\);/)
  assert.match(rowRule, /padding:\s*var\(--ait-space-3\) var\(--ait-space-0\);/)
  assert.match(cssRuleBody(styles, '.intro-feature-list .intro-feature-icon'), /align-items:\s*center;/)
  assert.match(rowTitleRule, /font-size:\s*var\(--ait-font-size-title-sm\);/)
  assert.match(rowTitleRule, /font-weight:\s*600;/)
  assert.match(rowTitleRule, /letter-spacing:\s*0;/)
  assert.match(curationRowTitleRule, /scaleX\(var\(--ait-component-intro-feature-title-compact-scale\)\)/)
  assert.match(rowBodyRule, /font-size:\s*var\(--ait-font-size-body-md\);/)
})

test('IntroPage aligns its coral accent with the feature icon scale', () => {
  const tokens = fs.readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8')
  const styles = appCssSource()
  const copyRule = cssRuleBody(styles, '.intro-feature-copy')

  assert.match(tokens, /--ait-color-aniwhere-text-coral:\s*var\(--ait-color-aniwhere-icon-coral\);/)
  assert.match(tokens, /--ait-color-intro-title-highlight:\s*rgba\(255,\s*103,\s*79,\s*0\.2\);/)
  assert.match(tokens, /--ait-component-intro-feature-asset-size:\s*48px;/)
  assert.match(tokens, /--ait-component-intro-feature-icon-size:\s*44px;/)
  assert.match(tokens, /--ait-component-intro-feature-icon-scale-curation:\s*1\.14;/)
  assert.match(tokens, /--ait-component-intro-feature-icon-scale-review:\s*0\.92;/)
  assert.match(copyRule, /gap:\s*var\(--ait-space-1\);/)
})
