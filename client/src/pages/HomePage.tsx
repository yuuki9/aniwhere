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

function HomeTrendChipRail({ items }: { items: TrendRankingItem[] }) {
  return (
    <section className="home-trend-section" aria-label="추천 검색어">
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
    </section>
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
        <h2 id="home-recent-viewed-title">최근 본 곳</h2>
      </div>
      <div className="home-recent-viewed-list">
        {shops.map((shop) => (
          <Link className="home-recent-viewed-row" key={shop.id} to={buildRecentViewedShopHref(shop.id)}>
            <span className="home-recent-viewed-copy">
              <strong>{shop.name}</strong>
              <small>{shop.regionName ?? shop.address}</small>
            </span>
            {shop.categories.length > 0 ? (
              <span className="home-recent-viewed-chip">{shop.categories[0]}</span>
            ) : null}
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
    </main>
  )
}
