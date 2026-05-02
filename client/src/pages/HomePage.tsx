import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import aniwhereIcon from '../assets/aniwhere_icon.png'
import {
  buildHomeQuickMenus,
  type HomeQuickMenu,
} from './homeViewModel'

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
      <HomePendingCard title="작품별 매장 모아보기는 준비 중이에요" description="홈 전용 API가 준비되면 작품별 취급 매장을 연결할게요." />
    </section>
  )
}

function HomeReviewPreviewSection() {
  return (
    <section aria-labelledby="home-review-preview-title" className="home-review-preview-section">
      <div className="home-section-head">
        <h2 id="home-review-preview-title">최근 방문 후기</h2>
      </div>
      <HomePendingCard title="아직 소개할 방문 후기가 없어요" description="매장별 후기 API가 준비되면 사진과 함께 최근 방문 기록을 보여드릴게요." />
    </section>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const quickMenus = useMemo(() => buildHomeQuickMenus(), [])

  return (
    <main className="app-shell discover-shell">
      <HomeHeader onSearch={() => navigate('/search')} />
      <HomeQuickMenuSection menus={quickMenus} />
      <HomeIssueSection />
      <HomeReviewPreviewSection />
    </main>
  )
}
