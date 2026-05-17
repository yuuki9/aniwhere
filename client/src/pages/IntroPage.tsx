import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import introFeatureCurationIcon from '../assets/icons/intro-feature-curation.webp'
import introFeatureMapIcon from '../assets/icons/intro-feature-map.webp'
import introFeatureReviewIcon from '../assets/icons/intro-feature-review.webp'
import aniwhereIcon from '../assets/aniwhere_icon.png'
import introStoreGuide from '../assets/intro-store-guide.webp'
import { isAppsInTossRuntime } from '../shared/lib/auth'
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
            <li className={`ait-list-row intro-chain-row intro-chain-row-${item.icon}`} key={item.title}>
              <span className="ait-list-row-asset">
                <IntroFeatureIcon name={item.iconName} type={item.icon} />
              </span>
              <span className="ait-list-row-copy intro-feature-copy">
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="intro-mobile-actions">
          <Button
            color="primary"
            display="block"
            onClick={handleStart}
            size="xlarge"
            variant="fill"
          >
            입장하기
          </Button>
        </div>
      </section>
    </main>
  )
}
