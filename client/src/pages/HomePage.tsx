import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import aniwhereIcon from '../assets/aniwhere_icon.png'
import { getShops } from '../shared/api/shops'
import type { Shop } from '../shared/api/types'
import {
  buildHomeIssueCards,
  buildHomeQuickMenus,
  type HomeIssueCard,
  type HomeQuickMenu,
} from './homeViewModel'

const EMPTY_SHOPS: Shop[] = []
const HOME_SHOP_PAGE_SIZE = 200

async function getHomeShops() {
  const firstPage = await getShops({ page: 0, size: HOME_SHOP_PAGE_SIZE })
  const shops = [...firstPage.content]

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await getShops({ page, size: HOME_SHOP_PAGE_SIZE })
    shops.push(...nextPage.content)
  }

  return shops
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="home-icon-svg" viewBox="0 0 24 24">
      <path
        d="m20 20-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function HomeQuickMenuIcon({ icon }: { icon: HomeQuickMenu['icon'] }) {
  const commonProps = {
    'aria-hidden': true,
    className: 'home-quick-icon-svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  }

  switch (icon) {
    case 'pin':
      return (
        <svg {...commonProps}>
          <path d="M12 21s-5.2-5.1-5.2-9.4a5.2 5.2 0 1 1 10.4 0C17.2 15.9 12 21 12 21Z" />
          <circle cx="12" cy="11.4" r="1.8" />
        </svg>
      )
    case 'review':
      return (
        <svg {...commonProps}>
          <path d="M5 6.5h14v9.2H9.2L5 19.5v-13Z" />
          <path d="M8.5 10h7M8.5 13h4.5" />
        </svg>
      )
    case 'report':
      return (
        <svg {...commonProps}>
          <path d="M12 21s-5.2-5.1-5.2-9.4a5.2 5.2 0 1 1 10.4 0C17.2 15.9 12 21 12 21Z" />
          <path d="M12 8.8v5.2M9.4 11.4h5.2" />
        </svg>
      )
    default:
      return null
  }
}

function HomeIssueVisual({
  label,
  visual,
  variant = 'card',
}: {
  label?: string
  visual: HomeIssueCard['visual']
  variant?: 'card' | 'chip'
}) {
  const className = `home-issue-visual home-issue-visual-${variant}`

  if (variant === 'chip') {
    return (
      <div className={className} aria-hidden="true">
        <span className="home-work-chip-logo-text">{label}</span>
      </div>
    )
  }

  if (visual === 'capsule') {
    return (
      <div className={className} aria-hidden="true">
        <svg className="home-issue-visual-svg" viewBox="0 0 180 116">
          <rect className="home-issue-visual-fill" x="35" y="18" width="110" height="80" rx="22" />
          <rect className="home-issue-visual-panel" x="58" y="32" width="64" height="38" rx="12" />
          <circle className="home-issue-visual-dot" cx="74" cy="51" r="9" />
          <circle className="home-issue-visual-dot" cx="105" cy="51" r="9" />
          <path className="home-issue-visual-line" d="M66 88h48M130 44h13M130 58h13" />
        </svg>
      </div>
    )
  }

  if (visual === 'ticket') {
    return (
      <div className={className} aria-hidden="true">
        <svg className="home-issue-visual-svg" viewBox="0 0 180 116">
          <path
            className="home-issue-visual-fill"
            d="M38 40a14 14 0 0 1 14-14h82a14 14 0 0 1 14 14v12a12 12 0 0 0 0 24v12a14 14 0 0 1-14 14H52a14 14 0 0 1-14-14V76a12 12 0 0 0 0-24V40Z"
          />
          <path className="home-issue-visual-line" d="M72 42h42M72 58h34M72 74h48M126 34v60" />
          <circle className="home-issue-visual-dot" cx="58" cy="48" r="6" />
          <circle className="home-issue-visual-dot" cx="58" cy="82" r="6" />
        </svg>
      </div>
    )
  }

  return (
    <div className={className} aria-hidden="true">
      <svg className="home-issue-visual-svg" viewBox="0 0 180 116">
        <rect className="home-issue-visual-fill" x="38" y="28" width="104" height="66" rx="14" />
        <path className="home-issue-visual-panel" d="M50 42h80v40H50z" />
        <path className="home-issue-visual-line" d="M58 54h18M58 70h26M98 54h20M98 70h14M46 94h88" />
        <circle className="home-issue-visual-dot" cx="82" cy="62" r="7" />
        <circle className="home-issue-visual-dot" cx="122" cy="62" r="7" />
      </svg>
    </div>
  )
}

function HomeShopStatus({
  isError,
  isLoading,
  children,
}: {
  isError?: boolean
  isLoading?: boolean
  children: string
}) {
  if (isError) {
    return (
      <p className="error-text" role="alert">
        {children}
      </p>
    )
  }

  return (
    <p className="discover-state-text" role={isLoading ? 'status' : undefined}>
      {children}
    </p>
  )
}

function HomeHeader({ onSearch }: { onSearch: () => void }) {
  return (
    <header className="home-store-header">
      <Link className="home-store-brand" to="/home" aria-label="애니웨어 홈">
        <img className="home-store-brand-icon" src={aniwhereIcon} alt="" aria-hidden="true" />
        애니웨어
      </Link>
      <button className="home-header-icon-button" type="button" aria-label="검색하기" onClick={onSearch}>
        <SearchIcon />
      </button>
    </header>
  )
}

function HomeQuickMenuSection({ menus }: { menus: HomeQuickMenu[] }) {
  return (
    <nav className="home-quick-menu" aria-label="홈 빠른 메뉴">
      {menus.map((menu) => (
        <Link className="home-quick-menu-item" key={menu.id} to={menu.href}>
          <span className="home-quick-icon">
            <HomeQuickMenuIcon icon={menu.icon} />
          </span>
          <span>{menu.label}</span>
        </Link>
      ))}
    </nav>
  )
}

function HomeIssueSection({ cards }: { cards: HomeIssueCard[] }) {
  const railRef = useRef<HTMLDivElement>(null)
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>(cards[0]?.id)
  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? cards[0]

  useEffect(() => {
    const rail = railRef.current

    if (!rail) {
      return
    }

    const handleRailWheel = (event: WheelEvent) => {
      const maxScrollLeft = rail.scrollWidth - rail.clientWidth

      if (maxScrollLeft <= 0) {
        return
      }

      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, rail.scrollLeft + delta))

      if (nextScrollLeft !== rail.scrollLeft) {
        event.preventDefault()
        rail.scrollLeft = nextScrollLeft
      }
    }

    rail.addEventListener('wheel', handleRailWheel, { passive: false })

    return () => {
      rail.removeEventListener('wheel', handleRailWheel)
    }
  }, [selectedCard?.id])

  const scrollRail = (direction: 'prev' | 'next') => {
    const rail = railRef.current

    if (!rail) {
      return
    }

    rail.scrollBy({
      left: direction === 'next' ? rail.clientWidth * 0.82 : rail.clientWidth * -0.82,
      behavior: 'smooth',
    })
  }

  if (!selectedCard) {
    return null
  }

  return (
    <section aria-labelledby="home-issues-title" className="home-issue-section" id="home-issues">
      <div className="home-section-head">
        <h2 id="home-issues-title">작품으로 찾기</h2>
        <div className="home-rail-controls" aria-label="작품 이동">
          <button type="button" aria-label="이전 작품 보기" onClick={() => scrollRail('prev')}>
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" aria-label="다음 작품 보기" onClick={() => scrollRail('next')}>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
      <div className="home-work-chip-rail" ref={railRef} aria-label="작품 선택">
        {cards.map((card) => (
          <button
            className={`home-work-chip home-work-chip-${card.tone}`}
            key={card.id}
            type="button"
            aria-pressed={card.id === selectedCard.id}
            aria-label={`${card.title} 취급 매장 보기`}
            onClick={() => setSelectedCardId(card.id)}
          >
            <HomeIssueVisual label={card.title} visual={card.visual} variant="chip" />
          </button>
        ))}
      </div>
      <article className={`home-work-store-panel home-issue-card-${selectedCard.tone}`}>
        <header className="home-work-store-panel-head">
          <h3>{selectedCard.title}</h3>
          <small>취급 매장</small>
        </header>
        {selectedCard.stores.length > 0 ? (
          <>
            <ul className="home-work-store-list" aria-label={`${selectedCard.title} 취급 매장`}>
              {selectedCard.stores.map((store) => (
                <li key={store.id}>
                  <Link to={store.href}>
                    <span className="home-work-store-placeholder" aria-hidden="true" />
                    <span className="home-work-store-copy">
                      <strong>{store.name}</strong>
                      <small>{store.meta}</small>
                      <span>{store.detail}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {selectedCard.remainingStoreCount > 0 ? (
              <Link className="home-work-store-more" data-discover="true" to={selectedCard.href}>
                {selectedCard.remainingStoreCount}개의 매장 더보기
              </Link>
            ) : null}
          </>
        ) : null}
      </article>
    </section>
  )
}

function HomeReviewPreviewSection() {
  return (
    <section aria-labelledby="home-review-preview-title" className="home-review-preview-section">
      <div className="home-section-head">
        <h2 id="home-review-preview-title">최근 방문 후기</h2>
      </div>
      <article className="home-review-empty-card">
        <strong>아직 소개할 방문 후기가 없어요</strong>
        <p>매장별 후기 API가 준비되면 사진과 함께 최근 방문 기록을 보여드릴게요.</p>
      </article>
    </section>
  )
}

export function HomePage() {
  const navigate = useNavigate()

  const shopsQuery = useQuery({
    queryKey: ['shops', 'discover-home'],
    queryFn: getHomeShops,
  })

  const allShops = useMemo(() => shopsQuery.data ?? EMPTY_SHOPS, [shopsQuery.data])
  const quickMenus = useMemo(() => buildHomeQuickMenus(), [])
  const issueCards = useMemo(() => buildHomeIssueCards(allShops), [allShops])

  return (
    <main className="app-shell discover-shell">
      <HomeHeader onSearch={() => navigate('/search')} />
      <HomeQuickMenuSection menus={quickMenus} />

      <HomeIssueSection cards={issueCards} />

      {shopsQuery.isLoading ? <HomeShopStatus isLoading>매장 정보를 불러오는 중입니다.</HomeShopStatus> : null}
      {shopsQuery.isError ? <HomeShopStatus isError>매장 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</HomeShopStatus> : null}
      {!shopsQuery.isLoading && !shopsQuery.isError ? <HomeReviewPreviewSection /> : null}
    </main>
  )
}
