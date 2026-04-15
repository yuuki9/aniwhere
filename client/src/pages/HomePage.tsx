import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getShops } from '../shared/api/shops'
import { formatRelativeUpdated } from '../shared/lib/format'
import { StatusPill } from '../shared/ui/StatusPill'

const EMPTY_SHOPS = []

type HeroTheme = {
  id: 'new-shops' | 'hot-keywords' | 'trusted-picks'
  title: string
  subtitle: string
  accent: 'blue' | 'orange' | 'mint'
  actionLabel: string
  actionTarget: '/explore' | '/search'
  spotlight: string
  markerPrimary: string
  markerSecondary: string
  visualLabel: string
}

const HERO_ROTATE_MS = 5200

export function HomePage() {
  const navigate = useNavigate()
  const [activeThemeIndex, setActiveThemeIndex] = useState(0)

  const shopsQuery = useQuery({
    queryKey: ['shops', 'discover-home'],
    queryFn: () => getShops({ page: 0, size: 200 }),
  })

  const allShops = useMemo(() => shopsQuery.data?.content ?? EMPTY_SHOPS, [shopsQuery.data?.content])

  const newestShops = useMemo(
    () =>
      [...allShops]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3),
    [allShops],
  )

  const trendingKeywords = useMemo(() => {
    const counts = new Map<string, number>()

    for (const shop of allShops) {
      for (const work of shop.works) {
        counts.set(work, (counts.get(work) ?? 0) + 1)
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [allShops])

  const rankedShops = useMemo(() => {
    return [...allShops]
      .sort((a, b) => {
        const aScore = (a.status === 'ACTIVE' ? 3 : 0) + a.links.length * 2 + a.works.length
        const bScore = (b.status === 'ACTIVE' ? 3 : 0) + b.links.length * 2 + b.works.length
        return bScore - aScore
      })
      .slice(0, 6)
  }, [allShops])

  const heroThemes = useMemo<HeroTheme[]>(() => {
    const newestRegion = newestShops[0]?.regionName ?? '홍대'
    const topKeyword = trendingKeywords[0]?.[0] ?? '가챠'
    const secondKeyword = trendingKeywords[1]?.[0] ?? '피규어'
    const bestShop = rankedShops[0]?.name ?? '추천 매장'

    return [
      {
        id: 'new-shops',
        title: '이번 주 새로 들어온 매장',
        subtitle: '방금 반영된 매장을 먼저 둘러보세요.',
        accent: 'blue',
        actionLabel: '신규 매장 보기',
        actionTarget: '/explore',
        spotlight: newestShops[0]?.name ?? '신규 매장 업데이트',
        markerPrimary: newestRegion,
        markerSecondary: newestShops[0] ? formatRelativeUpdated(newestShops[0].updatedAt) : '방금 반영',
        visualLabel: 'NEW',
      },
      {
        id: 'hot-keywords',
        title: '지금 많이 찾는 키워드',
        subtitle: '요즘 많이 찾는 작품 키워드부터 확인해보세요.',
        accent: 'orange',
        actionLabel: '키워드 검색',
        actionTarget: '/search',
        spotlight: `#${topKeyword} #${secondKeyword}`,
        markerPrimary: '실시간 인기',
        markerSecondary: `${trendingKeywords[0]?.[1] ?? 0}개 매장`,
        visualLabel: 'HOT',
      },
      {
        id: 'trusted-picks',
        title: '리뷰가 모인 추천 매장',
        subtitle: '많이 보는 매장부터 빠르게 비교해보세요.',
        accent: 'mint',
        actionLabel: '추천 매장 보기',
        actionTarget: '/explore',
        spotlight: bestShop,
        markerPrimary: '인기 큐레이션',
        markerSecondary: `상위 ${Math.min(rankedShops.length, 6)}곳`,
        visualLabel: 'TOP',
      },
    ]
  }, [newestShops, rankedShops, trendingKeywords])

  const activeTheme = heroThemes[activeThemeIndex] ?? heroThemes[0]

  useEffect(() => {
    if (heroThemes.length <= 1) {
      return
    }

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveThemeIndex((current) => (current + 1) % heroThemes.length)
    }, HERO_ROTATE_MS)

    return () => window.clearInterval(timer)
  }, [heroThemes.length])

  return (
    <main className="app-shell discover-shell">
      <section className="section discover-search-entry-section">
        <button className="search-entry-button discover-search-entry" type="button" onClick={() => navigate('/search')}>
          <span>매장명, 작품명, 지역으로 검색</span>
          <strong>⌕</strong>
        </button>
      </section>

      <section className={`section discover-hero discover-hero-${activeTheme.accent}`}>
        <div className="discover-hero-card">
          <div className="discover-hero-copy">
            <h1>{activeTheme.title}</h1>
            <p>{activeTheme.subtitle}</p>
            <strong className="discover-hero-spotlight">{activeTheme.spotlight}</strong>
            <button className="ghost-action compact-action" type="button" onClick={() => navigate(activeTheme.actionTarget)}>
              {activeTheme.actionLabel}
            </button>
          </div>

          <div className="discover-hero-visual" aria-hidden="true">
            <span className="discover-hero-visual-word">{activeTheme.visualLabel}</span>
            <div className="discover-hero-marker-stack">
              <span className="discover-hero-marker">{activeTheme.markerPrimary}</span>
              <span className="discover-hero-marker discover-hero-marker-secondary">{activeTheme.markerSecondary}</span>
            </div>
          </div>
        </div>

        <div className="discover-hero-controls" aria-label="메인 큐레이션 넘기기">
          <div className="discover-slide-dots">
            {heroThemes.map((theme, index) => (
              <button
                key={theme.id}
                type="button"
                className={`discover-slide-dot ${index === activeThemeIndex ? 'discover-slide-dot-active' : ''}`}
                aria-label={theme.title}
                onClick={() => setActiveThemeIndex(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section discover-ranking-section">
        <div className="section-header">
          <div>
            <h2>지금 많이 보는 매장</h2>
          </div>
          <Link className="text-link" to="/explore">
            전체 보기
          </Link>
        </div>

        <div className="discover-ranking-viewport" aria-label="인기 매장 가로 목록">
          <div className="discover-ranking-strip">
            {rankedShops.map((shop, index) => (
              <Link className={`discover-rank-card discover-rank-card-${index + 1 > 3 ? 4 : index + 1}`} key={shop.id} to={`/shops/${shop.id}`}>
                <div className="discover-rank-header">
                  <div className="discover-rank-badge">
                    <span>{index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '•'}</span>
                    <strong>{index + 1}</strong>
                  </div>
                  <StatusPill status={shop.status} />
                </div>
                <div className="discover-rank-visual" aria-hidden="true">
                  {shop.name.slice(0, 1)}
                </div>
                <div className="discover-rank-copy">
                  <strong>{shop.name}</strong>
                  <p>{shop.regionName ?? `지역 ${shop.regionId ?? '-'}`}</p>
                  <p className="shop-item-meta">
                    작품 {shop.works.length} · 링크 {shop.links.length} · {formatRelativeUpdated(shop.updatedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
