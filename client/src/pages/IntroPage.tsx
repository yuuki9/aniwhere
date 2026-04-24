import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import aniwhereIcon from '../assets/aniwhere_icon.png'
import { startServiceEntry } from '../shared/lib/auth'
import { AitButton, AitListRow, AitTop } from '../shared/ui/ait'

const featureItems = [
  {
    icon: 'map',
    title: '굿즈샵과 피규어샵을 빠르게 찾기',
    body: '지금 가볼 만한 매장을 지역 기준으로 바로 확인해보세요.',
  },
  {
    icon: 'time',
    title: '운영 상태와 방문 팁 한눈에 보기',
    body: '헛걸음하지 않도록 영업 정보와 최신 제보를 함께 보여드려요.',
  },
  {
    icon: 'spark',
    title: '후기와 제보로 정보를 더 정확하게',
    body: '커뮤니티에서 쌓인 현장 정보를 지도 탐색에 바로 반영합니다.',
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
      setStartError(error instanceof Error ? error.message : '시작하는 중 문제가 생겼습니다. 잠시 뒤 다시 시도해주세요.')
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
          title="가챠샵, 피규어샵, 굿즈샵을 한 번에 찾아보세요"
          subtitle="흩어진 매장 정보를 모아 지도에서 빠르게 탐색하고, 지금 가볼 만한 곳부터 바로 확인할 수 있어요."
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

        {startError ? <p className="error-text">{startError}</p> : null}

        <div className="intro-mobile-actions">
          <AitButton className="intro-primary-action" display="full" onClick={handleStart} disabled={isStarting}>
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
