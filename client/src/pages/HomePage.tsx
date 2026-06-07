import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import homeCtaFavoritesBannerImage from '../assets/images/home-cta-favorites-banner.png'
import homeCtaNearbyBannerImage from '../assets/images/home-cta-nearby-banner.png'
import homeCtaReviewsBannerImage from '../assets/images/home-cta-reviews-banner.png'
import { getMixedEntityRankings } from '../shared/api/rankings'
import { isAdminRole, readAuthSession } from '../shared/lib/authSession'
import { readRecentViewedShops, type RecentViewedShop } from '../shared/lib/recentViewedShops'
import { SHOP_SEARCH_PLACEHOLDER } from '../shared/lib/searchCopy'
import { TossBannerAd } from '../shared/ui/TossBannerAd'
import { Toast } from '@aniwhere/tds-mobile'
import {
  buildRecentViewedShopHref,
  buildHomeCtaCards,
  type HomeCtaCard,
} from './homeViewModel'
import {
  buildTrendExploreHref,
  buildTrendPreviewItems,
  formatTrendKindLabel,
  normalizeMixedEntityRankingItem,
  type TrendRankingItem,
} from './trendRankingViewModel'

const HOME_CTA_IMAGES: Record<HomeCtaCard['id'], string> = {
  map: homeCtaNearbyBannerImage,
  favorites: homeCtaFavoritesBannerImage,
  reviews: homeCtaReviewsBannerImage,
}

type HomeRouteState = {
  welcomeEmoji?: string
  welcomeNickname?: string
}

function readWelcomeProfile(state: unknown) {
  if (state == null || typeof state !== 'object') {
    return null
  }

  const value = (state as HomeRouteState).welcomeNickname
  if (typeof value !== 'string' || value.trim() === '') {
    return null
  }

  const emoji = (state as HomeRouteState).welcomeEmoji
  return {
    emoji: typeof emoji === 'string' && emoji.trim() !== '' ? emoji.trim() : null,
    nickname: value.trim(),
  }
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function HomeSearchEntry({ onSearch }: { onSearch: () => void }) {
  return (
    <section className="section discover-search-entry-section" aria-label="매장 검색">
      <button className="map-search-field home-search-entry" type="button" onClick={onSearch}>
        <span className="map-search-field-copy">{SHOP_SEARCH_PLACEHOLDER}</span>
        <SearchIcon />
      </button>
    </section>
  )
}

function HomeTrendChip({ item }: { item: TrendRankingItem }) {
  return (
    <Link
      aria-label={`${item.label} 관련 매장 검색 결과 보기`}
      className="home-trend-chip"
      to={buildTrendExploreHref(item, { returnTo: '/home' })}
    >
      <span className="home-trend-chip-rank" aria-hidden="true">
        {item.rank}
      </span>
      <span className="home-trend-chip-label">{item.label}</span>
      <span className="home-trend-chip-kind">{formatTrendKindLabel(item.kind)}</span>
    </Link>
  )
}

function HomeTrendRankRow({ item }: { item: TrendRankingItem }) {
  return (
    <Link className="home-trend-rank-row" to={buildTrendExploreHref(item, { returnTo: '/home' })}>
      <span className="home-trend-rank-number">{item.rank}</span>
      <span className="home-trend-rank-label">{item.label}</span>
      <span className="home-trend-rank-kind">{formatTrendKindLabel(item.kind)}</span>
    </Link>
  )
}

function HomeTrendChipRail({ items }: { items: TrendRankingItem[] }) {
  const [viewMode, setViewMode] = useState<'rail' | 'list'>('rail')

  return (
    <section className="home-trend-section" aria-label="추천 검색어">
      {viewMode === 'rail' ? (
        <div className="home-trend-rail-row">
          <div className="home-trend-chip-rail">
            <div className="home-trend-chip-track">
              {items.map((item) => (
                <HomeTrendChip key={`${item.kind}-${item.shopId ?? item.workId ?? item.label}-${item.rank}`} item={item} />
              ))}
            </div>
            <div className="home-trend-chip-track" aria-hidden="true">
              {items.map((item) => (
                <HomeTrendChip
                  key={`ghost-${item.kind}-${item.shopId ?? item.workId ?? item.label}-${item.rank}`}
                  item={item}
                />
              ))}
            </div>
          </div>
          <button className="home-trend-toggle-button" type="button" onClick={() => setViewMode('list')}>
            순위 보기
          </button>
        </div>
      ) : (
        <div className="home-trend-rank-panel">
          <div className="home-trend-rank-head">
            <span>인기 검색어</span>
            <button className="home-trend-toggle-button" type="button" onClick={() => setViewMode('rail')}>
              접기
            </button>
          </div>
          <div className="home-trend-rank-list">
            {items.map((item) => (
              <HomeTrendRankRow key={`rank-${item.kind}-${item.shopId ?? item.workId ?? item.label}-${item.rank}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function formatRecentViewedAt(viewedAt: string) {
  const viewedTime = new Date(viewedAt).getTime()
  if (!Number.isFinite(viewedTime)) {
    return '최근 봄'
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const viewedDate = new Date(viewedTime)
  const viewedDay = new Date(viewedDate.getFullYear(), viewedDate.getMonth(), viewedDate.getDate()).getTime()
  const dayDiff = Math.max(0, Math.floor((today - viewedDay) / 86_400_000))

  if (dayDiff === 0) {
    return '오늘 봄'
  }

  if (dayDiff === 1) {
    return '어제 봄'
  }

  if (dayDiff < 30) {
    return `${dayDiff}일 전 봄`
  }

  return `${viewedDate.getFullYear().toString().slice(2)}.${String(viewedDate.getMonth() + 1).padStart(2, '0')}.${String(
    viewedDate.getDate(),
  ).padStart(2, '0')} 봄`
}

function HomeRecentViewedHeartIcon({ isFavorite }: { isFavorite: boolean }) {
  return (
    <svg
      className="home-recent-viewed-heart"
      data-favorite={isFavorite ? 'true' : 'false'}
      aria-label={isFavorite ? '찜한 매장' : '찜하지 않은 매장'}
      viewBox="0 0 24 24"
    >
      <path d="M12 20s-7-4.4-9.2-8.2C1.2 9 2.1 5.5 5.3 4.5c1.8-.6 3.7.1 4.8 1.5L12 8.2 13.9 6c1.1-1.4 3-2.1 4.8-1.5 3.2 1 4.1 4.5 2.5 7.3C19 15.6 12 20 12 20Z" />
    </svg>
  )
}

function HomeCtaBannerBody({ card }: { card: HomeCtaCard }) {
  return (
    <>
      <span className="home-cta-media">
        <img className="home-cta-image" src={HOME_CTA_IMAGES[card.id]} alt={card.imageAlt} loading="lazy" />
      </span>
      <span className="home-cta-copy">
        <strong>
          {card.headlineLines.map((line) => (
            <span className="home-cta-copy-line" key={line}>
              {line}
            </span>
          ))}
        </strong>
      </span>
    </>
  )
}

function HomeCtaBannerList({ cards }: { cards: HomeCtaCard[] }) {
  return (
    <section className="home-cta-section" aria-label="매장 탐색 바로가기">
      <div className="home-cta-banner-list" aria-label="매장 탐색 바로가기">
        {cards.map((card) =>
          card.enabled && card.href ? (
            <Link className="home-cta-banner" key={card.id} to={card.href}>
              <HomeCtaBannerBody card={card} />
            </Link>
          ) : (
            <article
              className="home-cta-banner home-cta-banner-disabled"
              key={card.id}
              aria-disabled="true"
              aria-label={`${card.headlineLines.join(' ')} 준비 중`}
            >
              <HomeCtaBannerBody card={card} />
            </article>
          ),
        )}
      </div>
    </section>
  )
}

function HomeRecentViewedSection({ shops }: { shops: RecentViewedShop[] }) {
  return (
    <section className="home-recent-viewed-section" aria-labelledby="home-recent-viewed-title">
      <div className="home-section-head">
        <h2 id="home-recent-viewed-title">최근 둘러본 매장이에요</h2>
      </div>
      <div className="home-recent-viewed-list">
        {shops.map((shop) => (
          <Link className="home-recent-viewed-row" key={shop.id} to={buildRecentViewedShopHref(shop.id)}>
            <HomeRecentViewedHeartIcon isFavorite={shop.isFavorite} />
            <span className="home-recent-viewed-name">{shop.name}</span>
            <span className="home-recent-viewed-date">{formatRecentViewedAt(shop.viewedAt)}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function HomeAdminEntry() {
  return (
    <section className="home-admin-entry-section" aria-label="관리자 메뉴">
      <Link className="home-admin-entry-card" to="/admin">
        <span className="home-admin-entry-copy">
          <strong>운영 관리</strong>
          <small>매장 등록과 검수 화면으로 이동해요.</small>
        </span>
        <span className="home-admin-entry-arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </section>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [welcomeProfile, setWelcomeProfile] = useState(() => readWelcomeProfile(location.state))
  const [recentViewedShops, setRecentViewedShops] = useState<RecentViewedShop[]>([])
  const ctaCards = useMemo(() => buildHomeCtaCards(), [])
  const canEnterAdmin = useMemo(() => import.meta.env.DEV || isAdminRole(readAuthSession()?.role), [])
  const trendRankingQuery = useQuery({
    queryKey: ['rankings', 'home-search-entities', '7d', 5],
    queryFn: () => getMixedEntityRankings({ window: '7d', limit: 5 }),
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
  const trendItems = useMemo(
    () => buildTrendPreviewItems((trendRankingQuery.data?.items ?? []).map(normalizeMixedEntityRankingItem), 5),
    [trendRankingQuery.data?.items],
  )

  useEffect(() => {
    if (welcomeProfile == null) {
      return
    }

    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location.pathname, location.search, navigate, welcomeProfile])

  useEffect(() => {
    let ignore = false

    void readRecentViewedShops().then((shops) => {
      if (!ignore) {
        setRecentViewedShops(shops.slice(0, 3))
      }
    })

    return () => {
      ignore = true
    }
  }, [])

  return (
    <main className="app-shell discover-shell">
      <Toast
        open={welcomeProfile != null}
        text={
          welcomeProfile != null
            ? `${welcomeProfile.emoji != null ? `${welcomeProfile.emoji} ` : ''}${welcomeProfile.nickname}님 반가워요!`
            : ''
        }
        position="top"
        onClose={() => setWelcomeProfile(null)}
      />
      {canEnterAdmin ? <HomeAdminEntry /> : null}
      <HomeSearchEntry onSearch={() => navigate('/search')} />
      {trendItems.length > 0 ? <HomeTrendChipRail items={trendItems} /> : null}
      <HomeCtaBannerList cards={ctaCards} />
      {recentViewedShops.length > 0 ? <HomeRecentViewedSection shops={recentViewedShops} /> : null}
      <TossBannerAd className="home-ad-banner" placement="home-bottom-cta" />
    </main>
  )
}
