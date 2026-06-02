import { Link } from 'react-router-dom'
import { AppTopNavigation } from '../../shared/ui/AppTopNavigation'

const adminMenuCards = [
  {
    description: '등록/수정할 매장 정보를 관리해요.',
    href: '/admin/shops',
    title: '매장 관리',
  },
  {
    description: '사용자 목록과 운영 권한을 관리해요.',
    href: '/admin/users',
    title: '사용자 관리',
  },
  {
    description: '신고/검수 리뷰의 노출 상태를 관리해요.',
    href: '/admin/reviews',
    title: '리뷰 관리',
  },
] as const

export function AdminHomePage() {
  return (
    <main className="app-shell admin-shell admin-shop-crud-shell admin-home-shell">
      <AppTopNavigation className="route-navigation" showBack title="운영 관리" showLogo={false} />

      <section className="home-cta-banner-list admin-home-menu-list" aria-label="관리 메뉴">
        {adminMenuCards.map((card) => (
          <Link className="home-cta-banner admin-home-menu-card" key={card.title} to={card.href}>
            <span className="admin-home-menu-copy">
              <strong>{card.title}</strong>
              <small>{card.description}</small>
            </span>
            <span className="admin-home-menu-arrow" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </section>
    </main>
  )
}
