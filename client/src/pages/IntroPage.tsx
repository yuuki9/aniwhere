import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { startServiceEntry } from '../shared/lib/auth'

const featureItems = [
  {
    icon: '📍',
    title: '근처 매장과 인기 매장을 빠르게 찾기',
    body: '지금 가볼 만한 매장을 바로 확인할 수 있어요.',
  },
  {
    icon: '🔗',
    title: '영업 상태와 공식 링크를 함께 확인',
    body: '가기 전에 꼭 필요한 정보부터 먼저 보여드려요.',
  },
  {
    icon: '✍️',
    title: '후기와 제보로 정보를 더 정확하게',
    body: '새로운 정보는 검수 후 서비스에 반영돼요.',
  },
]

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

      navigate('/discover', { state })
    } catch (error) {
      setStartError(
        error instanceof Error ? error.message : '시작하는 중 문제가 생겼습니다. 잠시 후 다시 시도해주세요.',
      )
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <main className="app-shell intro-mobile-shell">
      <section className="section intro-mobile-panel">
        <div className="intro-mobile-header">
          <div className="intro-service-badge">
            <span className="intro-service-icon">📍</span>
            <strong>Aniwhere</strong>
          </div>
        </div>

        <div className="intro-mobile-copy">
          <h1>가챠샵, 피규어샵, 굿즈샵을 한 번에 찾아보세요</h1>
          <p>흩어진 매장 정보를 모아 지금 가볼 곳부터 빠르게 보여드려요.</p>
        </div>

        <div className="intro-visual-card" aria-hidden="true">
          <div className="intro-visual-orb" />
          <div className="intro-visual-pin">📍</div>
        </div>

        <div className="intro-feature-list">
          {featureItems.map((item, index) => (
            <article className="intro-feature-item" key={item.title}>
              <div className="intro-feature-marker">
                <span>{item.icon}</span>
                {index < featureItems.length - 1 ? <i /> : null}
              </div>
              <div className="intro-feature-copy">
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>

        {startError ? <p className="error-text">{startError}</p> : null}

        <div className="intro-mobile-actions">
          <button className="primary-action intro-primary-action" type="button" onClick={handleStart} disabled={isStarting}>
            {isStarting ? '시작 준비 중…' : '시작하기'}
          </button>
          <Link className="text-link intro-secondary-link" to="/explore">
            매장 먼저 둘러보기
          </Link>
        </div>
      </section>
    </main>
  )
}
