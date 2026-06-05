import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import homeCtaFavoritesBannerImage from '../assets/images/home-cta-favorites-banner.png'
import homeCtaNearbyBannerImage from '../assets/images/home-cta-nearby-banner.png'
import homeCtaReviewsBannerImage from '../assets/images/home-cta-reviews-banner.png'
import { isAdminRole, readAuthSession } from '../shared/lib/authSession'
import { SHOP_SEARCH_PLACEHOLDER } from '../shared/lib/searchCopy'
import { Toast } from '@aniwhere/tds-mobile'
import {
  buildHomeCtaCards,
  type HomeCtaCard,
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
        <span className="map-search-field-copy">{SHOP_SEARCH_PLACEHOLDER}</span>
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
  const canEnterAdmin = useMemo(() => import.meta.env.DEV || isAdminRole(readAuthSession()?.role), [])

  useEffect(() => {
    if (welcomeProfile == null) {
      return
    }

    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location.pathname, location.search, navigate, welcomeProfile])

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
      <HomeCtaBannerList cards={ctaCards} />
      <HomeReviewPreviewSection />
    </main>
  )
}
