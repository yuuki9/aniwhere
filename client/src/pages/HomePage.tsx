import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import homeQuickAdminIcon from '../assets/icons/home-quick-admin.webp'
import homeQuickReviewIcon from '../assets/icons/home-quick-review.webp'
import homeQuickStoreIcon from '../assets/icons/home-quick-store.webp'
import { buildHomeQuickMenus, type HomeQuickMenu } from './homeViewModel'

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function HomeQuickMenuIcon({ icon }: { icon: HomeQuickMenu['icon'] }) {
  const iconSrc = {
    pin: homeQuickStoreIcon,
    review: homeQuickReviewIcon,
    admin: homeQuickAdminIcon,
  }[icon]

  return <img alt="" aria-hidden="true" className="home-quick-icon-image" src={iconSrc} />
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

function HomeQuickMenuSection({ menus }: { menus: HomeQuickMenu[] }) {
  return (
    <nav className="home-quick-menu" data-menu-count={menus.length} aria-label="홈 빠른 메뉴">
      {menus.map((menu) => (
        <Link className="home-quick-menu-item" key={menu.id} to={menu.href}>
          <span
            className={`home-quick-icon home-quick-icon-${menu.id}`}
            data-tds-asset-shape="squircle-background"
            data-tds-asset-size="medium"
            data-tds-icon-name={`home-${menu.icon}`}
          >
            <HomeQuickMenuIcon icon={menu.icon} />
          </span>
          <span>{menu.label}</span>
        </Link>
      ))}
    </nav>
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

function HomeIssueSection() {
  return (
    <section aria-labelledby="home-issues-title" className="home-issue-section" id="home-issues">
      <div className="home-section-head">
        <h2 id="home-issues-title">작품으로 찾기</h2>
      </div>
      <HomePendingCard
        title="작품별 매장 찾기를 준비 중이에요"
        description="확인된 매장부터 작품별로 차근차근 연결할게요."
      />
    </section>
  )
}

function HomeReviewPreviewSection() {
  return (
    <section aria-labelledby="home-review-preview-title" className="home-review-preview-section">
      <div className="home-section-head">
        <h2 id="home-review-preview-title">최근 방문 후기</h2>
      </div>
      <HomePendingCard
        title="첫 방문 후기를 기다리고 있어요"
        description="다녀온 매장 이야기가 모이면 탐색에 도움이 되는 후기부터 보여드릴게요."
      />
    </section>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const quickMenus = useMemo(() => buildHomeQuickMenus(), [])

  return (
    <main className="app-shell discover-shell">
      <HomeSearchEntry onSearch={() => navigate('/search')} />
      <HomeQuickMenuSection menus={quickMenus} />
      <HomeIssueSection />
      <HomeReviewPreviewSection />
    </main>
  )
}
