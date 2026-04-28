import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getShops } from '../shared/api/shops'
import { formatRelativeUpdated } from '../shared/lib/format'
import { GlobalNavigationMenu } from '../shared/ui/GlobalNavigationMenu'
import type { Shop } from '../shared/api/types'

const EMPTY_SHOPS: Shop[] = []

const getShopScore = (shop: Shop) => {
  return (shop.status === 'ACTIVE' ? 3 : 0) + shop.links.length * 2 + shop.works.length + (shop.visitTip ? 2 : 0)
}

const getPrimaryTag = (shop: Shop) => {
  return shop.categories[0] ?? shop.works[0] ?? (shop.sellsIchibanKuji ? '이치방쿠지' : '굿즈샵')
}

const getShopArea = (shop: Shop) => {
  return shop.regionName ?? `지역 ${shop.regionId ?? '-'}`
}

type SpotlightCard = {
  accent: 'blue' | 'orange' | 'green'
  eyebrow: string
  reason: string
  shop: Shop
}

export function HomePage() {
  const navigate = useNavigate()

  const shopsQuery = useQuery({
    queryKey: ['shops', 'discover-home'],
    queryFn: () => getShops({ page: 0, size: 200 }),
  })

  const allShops = useMemo(() => shopsQuery.data?.content ?? EMPTY_SHOPS, [shopsQuery.data?.content])

  const newestShops = useMemo(
    () =>
      [...allShops]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4),
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
        return getShopScore(b) - getShopScore(a)
      })
      .slice(0, 5)
  }, [allShops])

  const spotlightCards = useMemo<SpotlightCard[]>(() => {
    const seen = new Set<number>()
    const cards: SpotlightCard[] = []

    const addCard = (shop: Shop | undefined, eyebrow: string, reason: string, accent: SpotlightCard['accent']) => {
      if (!shop || seen.has(shop.id)) {
        return
      }

      seen.add(shop.id)
      cards.push({ accent, eyebrow, reason, shop })
    }

    addCard(newestShops[0], 'NEW', '방금 올라온 매장', 'blue')
    addCard(allShops.find((shop) => shop.sellsIchibanKuji), 'HOT', '이치방쿠지 체크', 'orange')
    addCard(rankedShops[0], 'PICK', '추천 매장', 'green')

    for (const shop of newestShops) {
      addCard(shop, 'NEW', '새로 업데이트', 'blue')
    }

    return cards.slice(0, 3)
  }, [allShops, newestShops, rankedShops])

  const shortcutItems = [
    { label: '새로 올라온 매장', to: '/explore', tone: 'blue' },
    { label: '내 주변 보기', to: '/explore', tone: 'green' },
    { label: '이치방쿠지', to: '/search?q=이치방쿠지', tone: 'orange' },
    { label: trendingKeywords[0]?.[0] ? `#${trendingKeywords[0][0]}` : '인기 키워드', to: '/search', tone: 'gray' },
  ] as const

  return (
    <main className="app-shell discover-shell">
      <section className="section discover-search-entry-section" aria-label="검색과 전체 메뉴">
        <div className="map-search-row">
          <GlobalNavigationMenu triggerClassName="global-nav-trigger global-nav-trigger-inline" />
          <button
            aria-label="매장명, 작품명, 지역명으로 검색하기"
            className="map-search-field"
            type="button"
            onClick={() => navigate('/search')}
          >
            <span className="map-search-field-copy">매장명, 작품명, 지역명으로 검색</span>
            <strong aria-hidden="true">검색</strong>
          </button>
        </div>
      </section>

      <section aria-labelledby="discover-title" className="section discover-hero discover-curation-hero">
        <div className="discover-curation-head">
          <span className="discover-brand-chip">오늘의 큐레이션</span>
          <div>
            <h1 id="discover-title">오늘 어디부터 볼까요?</h1>
            <p>새로 올라온 굿즈샵과 지금 눈에 띄는 매장을 가볍게 골라봤어요.</p>
          </div>
        </div>

        {shopsQuery.isLoading ? (
          <p className="discover-state-text" role="status">
            오늘의 매장을 고르는 중이에요.
          </p>
        ) : shopsQuery.isError ? (
          <p className="error-text" role="alert">
            매장 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        ) : spotlightCards.length === 0 ? (
          <p className="discover-state-text">아직 보여줄 매장이 없어요. 검색 화면에서 직접 찾아볼 수 있어요.</p>
        ) : (
          <div className="discover-spotlight-rail" aria-label="오늘의 큐레이션 매장">
            {spotlightCards.map((card) => (
              <Link
                className={`discover-spotlight-card discover-spotlight-card-${card.accent}`}
                key={`${card.eyebrow}-${card.shop.id}`}
                to={`/shops/${card.shop.id}`}
              >
                <span className="discover-spotlight-eyebrow">{card.eyebrow}</span>
                <strong>{card.shop.name}</strong>
                <span>
                  {getShopArea(card.shop)} · {getPrimaryTag(card.shop)}
                </span>
                <em>{card.reason}</em>
              </Link>
            ))}
          </div>
        )}

        <nav aria-label="빠른 탐색" className="discover-shortcut-row">
          {shortcutItems.map((item) => (
            <Link className={`discover-shortcut-chip discover-shortcut-chip-${item.tone}`} key={item.label} to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>
      </section>

      <section aria-labelledby="discover-ranking-title" className="section discover-ranking-section">
        <div className="section-header">
          <div>
            <span className="section-label">추천 픽</span>
            <h2 id="discover-ranking-title">지금 추천하는 매장</h2>
          </div>
          <Link className="text-link" to="/explore">
            전체 보기
          </Link>
        </div>

        {shopsQuery.isLoading ? (
          <p className="discover-state-text" role="status">
            매장 정보를 불러오는 중이에요.
          </p>
        ) : shopsQuery.isError ? (
          <p className="error-text" role="alert">
            매장 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        ) : rankedShops.length === 0 ? (
          <p className="discover-state-text">아직 보여줄 매장이 없어요. 검색 화면에서 직접 찾아볼 수 있어요.</p>
        ) : (
          <ol aria-label="추천 매장 목록" className="discover-ranking-list">
            {rankedShops.map((shop, index) => (
              <li key={shop.id}>
                <Link className="discover-rank-row" to={`/shops/${shop.id}`}>
                  <span className="discover-rank-order" aria-label={`${index + 1}위`}>
                    {index + 1}
                  </span>
                  <span className="discover-rank-copy">
                    <strong>{shop.name}</strong>
                    <span>
                      {getShopArea(shop)} · {getPrimaryTag(shop)} · {formatRelativeUpdated(shop.updatedAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  )
}
