import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import introStoreGuide from '../assets/intro-store-guide.webp'
import { AitButton, AitListRow, AitNavigation, AitTop } from '../shared/ui/ait'

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
  return (
    <span
      className={`intro-feature-icon intro-feature-icon-${type}`}
      data-tds-asset-shape="squircle-background"
      data-tds-asset-size="medium"
      data-tds-icon-name={name}
      aria-hidden="true"
    >
      <svg className="intro-feature-icon-svg" viewBox="0 0 24 24" focusable="false">
        {type === 'curation' ? (
          <>
            <path d="m12 4.8 1.9 4 4.4.6-3.2 3.1.8 4.4-3.9-2.1-3.9 2.1.8-4.4-3.2-3.1 4.4-.6L12 4.8z" />
          </>
        ) : null}
        {type === 'map' ? (
          <>
            <path d="M12 20s5-4.8 5-9a5 5 0 0 0-10 0c0 4.2 5 9 5 9z" />
            <circle cx="12" cy="11" r="1.7" />
          </>
        ) : null}
        {type === 'review' ? (
          <>
            <path d="M6.2 17.8 7 14l8.7-8.7a1.8 1.8 0 0 1 2.5 2.5L9.5 16.5l-3.3 1.3z" />
            <path d="m14.5 6.5 3 3" />
            <path d="M5.5 20h13" />
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
              asset={<IntroFeatureIcon name={item.iconName} type={item.icon} />}
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
            입장하기
          </AitButton>
        </div>
      </section>
    </main>
  )
}
