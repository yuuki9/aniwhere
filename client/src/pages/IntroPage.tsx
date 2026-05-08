import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import introStoreGuide from '../assets/intro-store-guide.webp'
import { AitButton, AitListRow, AitNavigation, AitTop } from '../shared/ui/ait'

type IntroFeatureIconType = 'curation' | 'map' | 'review'

const featureItems = [
  {
    icon: 'curation',
    title: '인기 작품을 모아봤어요',
    body: '요즘 많이 찾는 작품부터 둘러봐요',
  },
  {
    icon: 'map',
    title: '지도에서 한눈에 확인해요',
    body: '필터로 원하는 굿즈샵을 찾아봐요',
  },
  {
    icon: 'review',
    title: '방문 후기도 남겨요',
    body: '채택되면 포인트도 받을 수 있어요',
  },
] as const

function IntroFeatureIcon({ type }: { type: IntroFeatureIconType }) {
  return (
    <span className={`intro-feature-icon intro-feature-icon-${type}`} aria-hidden="true">
      <svg className="intro-feature-icon-svg" viewBox="0 0 24 24" focusable="false">
        {type === 'curation' ? (
          <>
            <rect x="5" y="6" width="9" height="13" rx="2" />
            <path d="M10.5 9.2l.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.2 1.8-.3.8-1.6z" />
            <path d="M15.5 8h2a1.5 1.5 0 0 1 1.5 1.5V17" />
            <path d="M16 17h3" />
          </>
        ) : null}
        {type === 'map' ? (
          <>
            <path d="M12 20s5-4.8 5-9a5 5 0 0 0-10 0c0 4.2 5 9 5 9z" />
            <circle cx="12" cy="11" r="1.7" />
            <path d="M4.5 18.5h15" />
          </>
        ) : null}
        {type === 'review' ? (
          <>
            <path d="M5 6.5h14v8.8H9.2L5 18.7V6.5z" />
            <path d="M8.5 10h5" />
            <path d="M8.5 12.6h3" />
            <path d="M15.1 12.4l1.2 1.2 2.3-2.6" />
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
