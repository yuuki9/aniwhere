import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import introFeatureCurationIcon from '../assets/icons/intro-feature-curation.webp'
import introFeatureMapIcon from '../assets/icons/intro-feature-map.webp'
import introFeatureReviewIcon from '../assets/icons/intro-feature-review.webp'
import aniwhereIcon from '../assets/aniwhere_icon.png'
import introStoreGuide from '../assets/intro-store-guide.webp'
import { isAppsInTossRuntime, startServiceEntry, TOSS_LOGIN_UNAVAILABLE_MESSAGE } from '../shared/lib/auth'
import { completeServiceEntry, saveAniwhereNickname } from '../shared/lib/authEntryFlow'
import {
  normalizeTossLoginReferrerForServer,
  toMaskedAuthorizationCode,
  type MaskedAuthorizationCode,
} from '../shared/lib/authDebug'
import type { AuthSession } from '../shared/lib/authSession'
import { Button } from '@aniwhere/tds-mobile'

type IntroFeatureIconType = 'curation' | 'map' | 'review'
type IntroFeatureIconName = 'icon-star-mono' | 'icon-pin-mono' | 'icon-pencil-mono'

const featureItems = [
  {
    icon: 'curation',
    iconName: 'icon-star-mono',
    title: '관심 있는 작품이 생겼나요?',
    body: '관련 굿즈샵을 추천해드려요',
  },
  {
    icon: 'map',
    iconName: 'icon-pin-mono',
    title: '지도에서 한눈에 확인해요',
    body: '필터로 원하는 매장을 찾아봐요',
  },
  {
    icon: 'review',
    iconName: 'icon-pencil-mono',
    title: '방문후기를 남겨요',
    body: '채택되면 포인트도 받을 수 있어요',
  },
] as const

function IntroFeatureIcon({ name, type }: { name: IntroFeatureIconName; type: IntroFeatureIconType }) {
  const iconSrc = {
    curation: introFeatureCurationIcon,
    map: introFeatureMapIcon,
    review: introFeatureReviewIcon,
  }[type]

  return (
    <span
      className={`intro-feature-icon intro-feature-icon-${type}`}
      data-tds-asset-shape="squircle-background"
      data-tds-asset-size="medium"
      data-tds-icon-name={name}
      aria-hidden="true"
    >
      <img alt="" className="intro-feature-icon-image" src={iconSrc} />
    </span>
  )
}

function IntroNavigation() {
  if (isAppsInTossRuntime()) {
    return null
  }

  return (
    <header className="intro-navigation">
      <div className="intro-navigation-brand" aria-label="애니웨어">
        <img className="intro-navigation-logo" src={aniwhereIcon} alt="" aria-hidden="true" />
        <span>애니웨어</span>
      </div>
    </header>
  )
}

type EntryRouteState =
  {
    entryMode: 'toss'
  }

type AuthDebugEntry = {
  authorizationCode: MaskedAuthorizationCode
  referrer: string
}

type AuthDebugSnapshot = {
  appLoginResult: AuthDebugEntry | null
  serverLoginPayload: AuthDebugEntry | null
}

const EMPTY_AUTH_DEBUG_SNAPSHOT: AuthDebugSnapshot = {
  appLoginResult: null,
  serverLoginPayload: null,
}

function MaskedAuthorizationCodeView({ code }: { code: MaskedAuthorizationCode }) {
  return (
    <dl className="intro-auth-debug-code">
      <div>
        <dt>present</dt>
        <dd>{String(code.present)}</dd>
      </div>
      <div>
        <dt>length</dt>
        <dd>{code.length}</dd>
      </div>
      {code.prefix != null ? (
        <div>
          <dt>prefix</dt>
          <dd>{code.prefix}</dd>
        </div>
      ) : null}
      {code.suffix != null ? (
        <div>
          <dt>suffix</dt>
          <dd>{code.suffix}</dd>
        </div>
      ) : null}
    </dl>
  )
}

function AuthDebugGroup({ title, value }: { title: string; value: AuthDebugEntry | null }) {
  if (value == null) {
    return null
  }

  return (
    <section className="intro-auth-debug-group">
      <strong>{title}</strong>
      <dl className="intro-auth-debug-meta">
        <div>
          <dt>authorizationCode</dt>
          <dd>
            <MaskedAuthorizationCodeView code={value.authorizationCode} />
          </dd>
        </div>
        <div>
          <dt>referrer</dt>
          <dd>{value.referrer}</dd>
        </div>
      </dl>
    </section>
  )
}

function IntroAuthDebugPanel({ snapshot }: { snapshot: AuthDebugSnapshot }) {
  if (snapshot.appLoginResult == null && snapshot.serverLoginPayload == null) {
    return null
  }

  return (
    <aside className="intro-auth-debug-panel" aria-label="ADS login debug">
      <p>ADS login debug</p>
      <AuthDebugGroup title="appLogin result" value={snapshot.appLoginResult} />
      <AuthDebugGroup title="server login payload" value={snapshot.serverLoginPayload} />
    </aside>
  )
}

export function IntroPage() {
  const navigate = useNavigate()
  const isEntryAttemptInFlightRef = useRef(false)
  const [isEntering, setIsEntering] = useState(false)
  const [isSavingNickname, setIsSavingNickname] = useState(false)
  const [entryError, setEntryError] = useState<string | null>(null)
  const [pendingNicknameSession, setPendingNicknameSession] = useState<AuthSession | null>(null)
  const [authDebugSnapshot, setAuthDebugSnapshot] = useState<AuthDebugSnapshot>(EMPTY_AUTH_DEBUG_SNAPSHOT)
  const [nicknameInput, setNicknameInput] = useState('')

  useEffect(() => {
    document.body.classList.add('intro-route-body')

    return () => {
      document.body.classList.remove('intro-route-body')
    }
  }, [])

  const handleStart = async () => {
    if (isEntryAttemptInFlightRef.current) {
      return
    }

    isEntryAttemptInFlightRef.current = true
    setIsEntering(true)
    setEntryError(null)
    setAuthDebugSnapshot(EMPTY_AUTH_DEBUG_SNAPSHOT)

    try {
      const entry = await startServiceEntry()
      const debugEntry = {
        authorizationCode: toMaskedAuthorizationCode(entry.authorizationCode),
        referrer: entry.referrer,
      }
      const serverDebugEntry = {
        authorizationCode: debugEntry.authorizationCode,
        referrer: normalizeTossLoginReferrerForServer(entry.referrer),
      }
      setAuthDebugSnapshot({
        appLoginResult: debugEntry,
        serverLoginPayload: serverDebugEntry,
      })
      const result = await completeServiceEntry(entry)
      const state: EntryRouteState = { entryMode: 'toss' }
      if (result.mode === 'needsNickname') {
        setPendingNicknameSession(result.session)
        setNicknameInput(result.user.nickname ?? '')
        return
      }
      navigate('/home', { state })
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인을 완료하지 못했어요. 다시 시도해 주세요.'
      if (message !== TOSS_LOGIN_UNAVAILABLE_MESSAGE) {
        console.error('[aniwhere:intro] service entry failed', error)
      }
      setEntryError(message)
    } finally {
      isEntryAttemptInFlightRef.current = false
      setIsEntering(false)
    }
  }

  const handleEnterWithoutLogin = () => {
    navigate('/home')
  }

  const handleNicknameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pendingNicknameSession == null) {
      return
    }

    setIsSavingNickname(true)
    setEntryError(null)

    try {
      await saveAniwhereNickname(nicknameInput, pendingNicknameSession.accessToken)
      navigate('/home', { state: { entryMode: 'toss' } satisfies EntryRouteState })
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : '닉네임을 저장하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setIsSavingNickname(false)
    }
  }

  return (
    <main className="app-shell intro-mobile-shell">
      <IntroNavigation />
      <section className="section intro-mobile-panel">
        <figure className="intro-guide-figure">
          <img
            alt="지도 위 굿즈샵 정보를 안내하는 애니웨어 마스코트"
            className="intro-guide-image"
            src={introStoreGuide}
          />
        </figure>

        <div className="intro-top">
          <h1 className="intro-top-title">
            흩어진 굿즈샵 정보,
            <br />
            <span className="intro-title-accent">애니웨어</span>에 모아뒀어요
          </h1>
        </div>

        <ul className="intro-feature-list" aria-label="Aniwhere 주요 기능">
          {featureItems.map((item) => (
            <li className={`intro-chain-row intro-chain-row-${item.icon}`} key={item.title}>
              <span className="intro-feature-asset">
                <IntroFeatureIcon name={item.iconName} type={item.icon} />
              </span>
              <span className="intro-feature-copy">
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="intro-mobile-actions">
          {pendingNicknameSession == null ? (
            <Button
              color="primary"
              display="block"
              disabled={isEntering}
              onClick={handleStart}
              size="xlarge"
              variant="fill"
            >
              {isEntering ? '로그인 중이에요' : '로그인하고 입장하기'}
            </Button>
          ) : (
            <form className="intro-nickname-card" onSubmit={handleNicknameSubmit}>
              <label className="intro-nickname-label" htmlFor="intro-nickname">
                애니웨어에서 사용할 닉네임
              </label>
              <input
                className="intro-nickname-input"
                id="intro-nickname"
                inputMode="text"
                maxLength={50}
                onChange={(event) => setNicknameInput(event.target.value)}
                placeholder="예: 굿즈탐험가"
                type="text"
                value={nicknameInput}
              />
              <p className="intro-nickname-help">후기와 댓글에 표시되는 이름이에요. 나중에 다시 바꿀 수 있어요.</p>
              <Button
                color="primary"
                display="block"
                disabled={isSavingNickname}
                size="xlarge"
                type="submit"
                variant="fill"
              >
                {isSavingNickname ? '저장 중이에요' : '닉네임 저장하기'}
              </Button>
            </form>
          )}
          {pendingNicknameSession == null ? (
            <button className="intro-login-skip-button" type="button" onClick={handleEnterWithoutLogin}>
              로그인 없이 둘러보기
            </button>
          ) : null}
          {entryError ? <p className="intro-entry-error">{entryError}</p> : null}
          <IntroAuthDebugPanel snapshot={authDebugSnapshot} />
        </div>
      </section>
    </main>
  )
}
