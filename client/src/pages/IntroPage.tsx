import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import aniwhereIcon from '../assets/aniwhere_icon.png'
import introStoreGuide from '../assets/intro-store-guide.webp'
import { startServiceEntry } from '../shared/lib/auth'
import { AitButton, AitListRow, AitTop } from '../shared/ui/ait'

type IntroFeatureIconType = 'search' | 'write' | 'approve' | 'point'

const featureItems = [
  {
    icon: 'search',
    title: '매장 찾기',
    body: '피규어·가챠샵을 키워드와 지역으로 찾아요.',
  },
  {
    icon: 'write',
    title: '후기 작성',
    body: '방문한 매장의 경험을 간단히 남겨요.',
  },
  {
    icon: 'approve',
    title: '검토 승인',
    body: '운영팀 검토 후 승인 상태를 확인해요.',
  },
  {
    icon: 'point',
    title: '포인트 적립',
    body: '승인된 후기는 포인트로 이어져요.',
  },
] as const

function IntroFeatureIcon({ type }: { type: IntroFeatureIconType }) {
  return (
    <span className={`intro-feature-icon intro-feature-icon-${type}`} aria-hidden="true">
      <svg className="intro-feature-icon-svg" viewBox="0 0 24 24" focusable="false">
        {type === 'search' ? (
          <>
            <circle cx="10.5" cy="10.5" r="5.5" />
            <path d="M15 15l4.5 4.5" />
          </>
        ) : null}
        {type === 'write' ? (
          <>
            <path d="M5 18.5l4.2-1 8.9-8.9a2.1 2.1 0 0 0-3-3L6.2 14.5 5 18.5z" />
            <path d="M13.8 6.8l3.4 3.4" />
          </>
        ) : null}
        {type === 'approve' ? (
          <>
            <circle cx="12" cy="12" r="8" />
            <path d="M8.5 12.2l2.2 2.2 4.8-5" />
          </>
        ) : null}
        {type === 'point' ? (
          <>
            <circle cx="12" cy="12" r="8" />
            <text x="12" y="12" textAnchor="middle">
              P
            </text>
          </>
        ) : null}
      </svg>
    </span>
  )
}

type EntryRouteState =
  | {
      entryMode: 'preview'
    }
  | {
      entryMode: 'toss'
      referrer: 'DEFAULT' | 'SANDBOX'
    }

export function IntroPage() {
  const navigate = useNavigate()
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  const handleStart = async () => {
    if (isStarting) {
      return
    }

    setIsStarting(true)
    setStartError(null)

    try {
      const result = await startServiceEntry()
      const state: EntryRouteState =
        result.mode === 'preview'
          ? { entryMode: 'preview' }
          : { entryMode: 'toss', referrer: result.referrer }

      navigate('/home', { state })
    } catch (error) {
      setStartError(error instanceof Error ? error.message : '시작하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <main className="app-shell intro-mobile-shell">
      <section className="section intro-mobile-panel">
        <AitTop
          className="intro-top"
          brand={
            <div className="intro-brand-lockup">
              <img className="intro-brand-logo" src={aniwhereIcon} alt="" />
              <span>애니웨어</span>
            </div>
          }
          title={
            <>
              피규어·가챠샵을 찾고,
              <br />
              후기로 포인트까지
            </>
          }
        />

        <figure className="intro-guide-figure">
          <img
            alt="지도 위 굿즈샵과 가챠 머신을 안내하는 애니웨어 마스코트"
            className="intro-guide-image"
            src={introStoreGuide}
          />
        </figure>

        <ul className="intro-feature-list" aria-label="Aniwhere 주요 기능">
          {featureItems.map((item) => (
            <AitListRow
              asset={<IntroFeatureIcon type={item.icon} />}
              border="none"
              className="intro-chain-row"
              description={item.body}
              key={item.title}
              title={item.title}
            />
          ))}
        </ul>

        {startError ? (
          <p className="error-text" role="alert">
            {startError}
          </p>
        ) : null}

        <div className="intro-mobile-actions">
          <AitButton
            aria-busy={isStarting}
            className="intro-primary-action"
            disabled={isStarting}
            display="full"
            onClick={handleStart}
          >
            {isStarting ? '로그인 준비 중' : '토스로 로그인하기'}
          </AitButton>
          <Link className="ait-button ait-button-full intro-secondary-action" to="/explore">
            로그인 없이 둘러보기
          </Link>
        </div>
      </section>
    </main>
  )
}
