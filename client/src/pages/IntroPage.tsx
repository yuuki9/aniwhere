import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import introStoreGuide from '../assets/intro-store-guide.webp'
import { AitButton, AitListRow, AitNavigation, AitTop } from '../shared/ui/ait'

type IntroFeatureIconType = 'search' | 'write' | 'approve'

const featureItems = [
  {
    icon: 'search',
    title: '원하는 조건으로 찾아보고',
    body: '매장명·작품명·지역으로 시작해요',
  },
  {
    icon: 'write',
    title: '지도에서 비교하고',
    body: '위치와 방문 정보를 한눈에 살펴봐요',
  },
  {
    icon: 'approve',
    title: '후기 남기고 이어가요',
    body: '채택되면 포인트도 받을 수 있어요',
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
      </svg>
    </span>
  )
}

type EntryRouteState =
  {
    entryMode: 'preview'
  }

export function IntroPage() {
  const navigate = useNavigate()

  useEffect(() => {
    document.body.classList.add('intro-route-body')

    return () => {
      document.body.classList.remove('intro-route-body')
    }
  }, [])

  const handleStart = () => {
    const state: EntryRouteState = { entryMode: 'preview' }
    navigate('/home', { state })
  }

  return (
    <main className="app-shell intro-mobile-shell">
      <AitNavigation />
      <section className="section intro-mobile-panel">
        <figure className="intro-guide-figure">
          <img
            alt="지도 위 굿즈샵 정보를 안내하는 애니웨어 마스코트"
            className="intro-guide-image"
            src={introStoreGuide}
          />
        </figure>

        <AitTop
          className="intro-top"
          title={
            <>
              흩어진 굿즈샵 정보,
              <br />
              <span className="intro-title-accent">애니웨어</span>에 모아뒀어요
            </>
          }
        />

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

        <div className="intro-mobile-actions">
          <AitButton className="intro-primary-action" display="full" onClick={handleStart}>
            매장 둘러보기
          </AitButton>
        </div>
      </section>
    </main>
  )
}
