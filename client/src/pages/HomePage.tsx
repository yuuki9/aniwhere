import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import homeCtaFavoritesBannerImage from '../assets/images/home-cta-favorites-banner.png'
import homeCtaNearbyBannerImage from '../assets/images/home-cta-nearby-banner.png'
import homeCtaReviewsBannerImage from '../assets/images/home-cta-reviews-banner.png'
import { getWorks } from '../shared/api/works'
import { isAdminRole, readAuthSession } from '../shared/lib/authSession'
import { Toast } from '@aniwhere/tds-mobile'
import {
  buildHomeCtaCards,
  buildHomeWorkPreviewItems,
  type HomeCtaCard,
  type HomeWorkPreviewItem,
} from './homeViewModel'

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
        <span className="map-search-field-copy">작품, 매장명, 지역으로 검색</span>
        <SearchIcon />
      </button>
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

function HomePendingCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="home-pending-card">
      <strong>{title}</strong>
      <small>{description}</small>
    </article>
  )
}

function buildHomeWorkSearchHref(workName: string) {
  const params = new URLSearchParams()
  params.set('scope', 'work')
  params.set('keyword', workName)
  params.set('returnTo', '/home')

  return `/search?${params.toString()}`
}

function HomeWorkPosterCard({ work }: { work: HomeWorkPreviewItem }) {
  return (
    <Link
      aria-label={`${work.name} 취급 매장 보기`}
      className="home-work-poster-card"
      to={buildHomeWorkSearchHref(work.name)}
    >
      <span className="home-work-poster-art">
        {work.coverUrl ? (
          <img alt="" aria-hidden="true" src={work.coverUrl} />
        ) : (
          <span className="home-work-poster-empty" aria-hidden="true">
            {work.name.slice(0, 1)}
          </span>
        )}
        <span className="home-work-poster-badge">{work.badgeLabel}</span>
        <span className="home-work-poster-rank" data-rank-length={String(work.rank).length} aria-hidden="true">
          {work.rank}
        </span>
      </span>
      <strong className="home-work-poster-title">{work.name}</strong>
      {work.subtitle ? <small className="home-work-poster-subtitle">{work.subtitle}</small> : null}
    </Link>
  )
}

function HomeIssueSection({ works, isLoading, isError }: {
  works: HomeWorkPreviewItem[]
  isLoading: boolean
  isError: boolean
}) {
  return (
    <section aria-labelledby="home-issues-title" className="home-issue-section" id="home-issues">
      <div className="home-section-head">
        <h2 id="home-issues-title">인기 작품 TOP 20</h2>
      </div>
      {isLoading ? <HomePendingCard title="작품을 불러오는 중이에요" description="잠시만 기다려 주세요." /> : null}
      {isError ? <HomePendingCard title="작품을 불러오지 못했어요" description="검색으로 매장을 계속 찾을 수 있어요." /> : null}
      {!isLoading && !isError && works.length === 0 ? (
        <HomePendingCard title="연결된 작품이 아직 없어요" description="확인된 작품부터 보여드릴게요." />
      ) : null}
      {works.length > 0 ? (
        <div className="home-work-poster-rail">
          <div className="home-work-poster-carousel" aria-label="작품 포스터 가로 스크롤">
            {works.map((work) => (
              <HomeWorkPosterCard key={work.id} work={work} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function HomeReviewPreviewSection() {
  return (
    <section aria-labelledby="home-review-preview-title" className="home-review-preview-section">
      <div className="home-section-head">
        <h2 id="home-review-preview-title">방문 리뷰</h2>
      </div>
      <HomePendingCard
        title="매장별 리뷰로 정리 중이에요"
        description="리뷰는 각 매장 상세 화면의 리뷰 탭에서 확인할 수 있어요."
      />
    </section>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [welcomeProfile, setWelcomeProfile] = useState(() => readWelcomeProfile(location.state))
  const ctaCards = useMemo(() => buildHomeCtaCards(), [])
  const canEnterAdmin = useMemo(() => isAdminRole(readAuthSession()?.role), [])
  const worksQuery = useQuery({
    queryKey: ['works', 'home-preview'],
    queryFn: getWorks,
    staleTime: 1000 * 60 * 10,
  })
  const workItems = useMemo(
    () => buildHomeWorkPreviewItems(worksQuery.data ?? []),
    [worksQuery.data],
  )

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
      <HomeSearchEntry onSearch={() => navigate('/search')} />
      <HomeCtaBannerList cards={ctaCards} />
      {canEnterAdmin ? <HomeAdminEntry /> : null}
      <HomeIssueSection works={workItems} isLoading={worksQuery.isLoading} isError={worksQuery.isError} />
      <HomeReviewPreviewSection />
    </main>
  )
}
