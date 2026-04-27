import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import aniwhereIcon from '../assets/aniwhere_icon.png'
import { startServiceEntry } from '../shared/lib/auth'
import { AitButton, AitListRow, AitTop } from '../shared/ui/ait'

const featureItems = [
  {
    icon: 'map',
    title: '굿즈샵과 이치방쿠지를 빠르게 찾기',
    body: '지금 가볼 만한 매장을 지역 기준으로 바로 확인해요.',
  },
  {
    icon: 'time',
    title: '운영 상태와 최근 업데이트 보기',
    body: '헛걸음하지 않도록 영업 정보와 최신 수정 시점을 함께 보여줘요.',
  },
  {
    icon: 'spark',
    title: '작품과 매장 정보를 한눈에 비교',
    body: '관심 작품, 공식 링크, 방문 팁을 방문 판단에 필요한 만큼만 정리해요.',
  },
] as const

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
              <span>Aniwhere</span>
            </div>
          }
          title="가챠샵, 애니메이션샵, 굿즈샵을 한 번에 찾아보세요"
          subtitle="흩어진 매장 정보를 모아 지역과 작품 기준으로 빠르게 탐색하고, 지금 가볼 만한 곳을 바로 확인할 수 있어요."
        />

        <ul className="intro-feature-list" aria-label="Aniwhere 주요 기능">
          {featureItems.map((item, index) => (
            <AitListRow
              asset={<span className={`intro-feature-asset intro-feature-asset-${item.icon}`} aria-hidden="true" />}
              border={index === 0 ? 'none' : 'indented'}
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
            {isStarting ? '시작 준비 중' : '시작하기'}
          </AitButton>
          <Link className="text-link intro-secondary-link" to="/explore">
            매장 먼저 둘러보기
          </Link>
        </div>
      </section>
    </main>
  )
}
