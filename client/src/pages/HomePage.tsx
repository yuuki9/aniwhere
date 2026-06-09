import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import homeCtaFavoritesBannerImage from '../assets/images/home-cta-favorites-banner.png'
import homeCtaNearbyBannerImage from '../assets/images/home-cta-nearby-banner.png'
import homeCtaReviewsBannerImage from '../assets/images/home-cta-reviews-banner.png'
import { getMixedEntityRankings } from '../shared/api/rankings'
import { listRecentReviews } from '../shared/api/shopReviews'
import type { RecentShopReview } from '../shared/api/types'
import { isAdminRole, readAuthSession } from '../shared/lib/authSession'
import { profileEmojiUrl } from '../shared/lib/profileEmojiOptions'
import { SHOP_SEARCH_PLACEHOLDER } from '../shared/lib/searchCopy'
import { TossBannerAd } from '../shared/ui/TossBannerAd'
import { Toast } from '@aniwhere/tds-mobile'
import {
  buildRecentReviewShopHref,
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
import { TrendRankingPanel } from './TrendRankingPanel'

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

function ReviewStarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m12 3 2.6 5.5 6 .9-4.3 4.2 1 6-5.3-2.9-5.3 2.9 1-6-4.3-4.2 6-.9L12 3Z" />
    </svg>
  )
}

function HelpfulIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M7.5 20H5.2a1.7 1.7 0 0 1-1.7-1.7v-7.1c0-.9.8-1.7 1.7-1.7h2.3m0 10.5V9.5m0 10.5h8.3c.8 0 1.5-.5 1.7-1.3l1.8-6.1a1.8 1.8 0 0 0-1.7-2.3h-4.1l.6-3.1a2.4 2.4 0 0 0-.7-2.2l-.2-.2a1.1 1.1 0 0 0-1.7.2L7.5 11" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m9 5 7 7-7 7" />
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

function HomeTrendChip({ item, inert = false }: { item: TrendRankingItem; inert?: boolean }) {
  const content = (
    <>
      <span className="home-trend-chip-rank" aria-hidden="true">
        {item.rank}
      </span>
      <span className="home-trend-chip-label">{item.label}</span>
      <span className="home-trend-chip-kind">{formatTrendKindLabel(item.kind)}</span>
    </>
  )

  if (inert) {
    return (
      <span className="home-trend-chip" aria-hidden="true">
        {content}
      </span>
    )
  }

  return (
    <Link
      aria-label={`${item.label} 관련 매장 검색 결과 보기`}
      className="home-trend-chip"
      to={buildTrendExploreHref(item, { returnTo: '/home' })}
    >
      {content}
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
                  inert
                />
              ))}
            </div>
          </div>
          <button className="home-trend-toggle-button" type="button" onClick={() => setViewMode('list')}>
            순위 보기
          </button>
        </div>
      ) : (
        <TrendRankingPanel
          items={items}
          returnTo="/home"
          action={(
            <button className="home-trend-toggle-button" type="button" onClick={() => setViewMode('rail')}>
              접기
            </button>
          )}
        />
      )}
    </section>
  )
}

function formatRecentReviewDate(createdAt: string | null | undefined) {
  if (!createdAt) {
    return '최근 리뷰'
  }

  const createdTime = new Date(createdAt).getTime()
  if (!Number.isFinite(createdTime)) {
    return '최근 리뷰'
  }

  const diffMs = Date.now() - createdTime
  const diffDays = Math.max(0, Math.floor(diffMs / 86_400_000))

  if (diffDays === 0) {
    return '오늘'
  }

  if (diffDays === 1) {
    return '어제'
  }

  if (diffDays < 30) {
    return `${diffDays}일 전`
  }

  const createdDate = new Date(createdTime)
  return `${createdDate.getFullYear().toString().slice(2)}.${String(createdDate.getMonth() + 1).padStart(2, '0')}.${String(
    createdDate.getDate(),
  ).padStart(2, '0')}`
}

function formatReviewRating(rating: number) {
  return Number.isFinite(rating) ? rating.toFixed(1) : '리뷰'
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

function HomeRecentReviewSection({
  currentUserId,
  reviews,
}: {
  currentUserId: number | null
  reviews: RecentShopReview[]
}) {
  return (
    <section className="home-recent-review-section" aria-labelledby="home-recent-review-title">
      <div className="home-section-head">
        <h2 id="home-recent-review-title">최근에 등록된 리뷰예요</h2>
      </div>
      <div className="home-recent-review-rail">
        {reviews.map((review) => {
          const authorEmojiUrl = profileEmojiUrl(review.authorEmojiIconFilename)
          const firstImage = [...review.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]
          const isMyReview = currentUserId != null && review.authorUserId === currentUserId

          return (
            <Link
              className="home-recent-review-card map-place-review-item"
              data-review-id={review.id}
              key={review.id}
              to={buildRecentReviewShopHref(review.shopId, review.id)}
            >
              <span className="home-recent-review-card-head map-place-review-item-head">
                {authorEmojiUrl != null ? (
                  <img className="home-recent-review-avatar map-place-review-avatar" src={authorEmojiUrl} alt="" aria-hidden="true" />
                ) : (
                  <span className="home-recent-review-avatar home-recent-review-avatar-fallback map-place-review-avatar" aria-hidden="true">
                    {review.authorNickname.trim().slice(0, 1) || '?'}
                  </span>
                )}
                <span className="home-recent-review-author map-place-review-author">
                  <span className="home-recent-review-author-row">
                    <strong>{review.authorNickname}</strong>
                    {isMyReview ? <span className="map-place-review-owner-badge">내 리뷰</span> : null}
                  </span>
                  <span className="home-recent-review-author-meta">
                    {formatRecentReviewDate(review.createdAt)}
                    <span aria-hidden="true">·</span>
                    <ReviewStarIcon />
                    {formatReviewRating(review.rating)}
                  </span>
                </span>
              </span>
              <span className={['home-recent-review-body', firstImage == null ? 'home-recent-review-body-text-only' : ''].filter(Boolean).join(' ')}>
                <span className="home-recent-review-copy map-place-review-text">{review.content}</span>
                {firstImage != null ? (
                  <span className="home-recent-review-image-frame map-place-review-image-frame">
                    <img className="home-recent-review-image map-place-review-image" src={firstImage.url} alt={`${review.shopName} 리뷰 사진`} loading="lazy" />
                  </span>
                ) : null}
              </span>
              <span className="home-recent-review-foot">
                <span className="home-recent-review-shop">
                  {review.shopName}
                  <ChevronRightIcon />
                </span>
                <span
                  className={['home-recent-review-helpful', review.likedByMe ? 'home-recent-review-helpful-active' : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  <HelpfulIcon />
                  도움돼요
                </span>
              </span>
            </Link>
          )
        })}
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
  const [homeAdVisible, setHomeAdVisible] = useState(false)
  const currentUserId = useMemo(() => readAuthSession()?.user?.id ?? null, [])
  const ctaCards = useMemo(() => buildHomeCtaCards(), [])
  const canEnterAdmin = useMemo(() => import.meta.env.DEV || isAdminRole(readAuthSession()?.role), [])
  const trendRankingQuery = useQuery({
    queryKey: ['rankings', 'home-search-entities', '7d', 10],
    queryFn: () => getMixedEntityRankings({ window: '7d', limit: 10 }),
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
  const trendItems = useMemo(
    () => buildTrendPreviewItems((trendRankingQuery.data?.items ?? []).map(normalizeMixedEntityRankingItem), 10),
    [trendRankingQuery.data?.items],
  )
  const recentReviewsQuery = useQuery({
    queryKey: ['shop-reviews', 'recent', 5, currentUserId],
    queryFn: () => listRecentReviews({ limit: 5 }),
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  useEffect(() => {
    if (welcomeProfile == null) {
      return
    }

    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location.pathname, location.search, navigate, welcomeProfile])

  return (
    <main className={['app-shell discover-shell', homeAdVisible ? 'discover-shell-ad-visible' : ''].filter(Boolean).join(' ')}>
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
      {(recentReviewsQuery.data?.length ?? 0) > 0 ? (
        <HomeRecentReviewSection currentUserId={currentUserId} reviews={recentReviewsQuery.data ?? []} />
      ) : null}
      <TossBannerAd className="home-ad-banner" placement="home-bottom-cta" onVisibleChange={setHomeAdVisible} />
    </main>
  )
}
