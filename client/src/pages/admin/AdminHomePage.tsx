import { Link } from 'react-router-dom'
import { AppTopNavigation } from '../../shared/ui/AppTopNavigation'

const adminHomeCards = [
  {
    description: '등록된 매장을 검수하고 새 매장을 등록해요.',
    href: '/admin/shops',
    icon: '店',
    status: '사용 가능',
    title: '매장 관리',
  },
  {
    description: '매장 리뷰 상태 변경 API가 연결되면 검수 흐름을 붙일 예정이에요.',
    href: null,
    icon: '후',
    status: '준비 중',
    title: '리뷰 검수',
  },
  {
    description: '사용자 조회와 운영 권한 관리 API가 연결되면 확장해요.',
    href: null,
    icon: '유',
    status: '준비 중',
    title: '사용자 관리',
  },
  {
    description: '사용자 프로필과 운영자 계정 정보를 확인하는 진입점으로 둘 예정이에요.',
    href: null,
    icon: '계',
    status: '준비 중',
    title: '계정 정보',
  },
]

function AdminHubCardContent({ card }: { card: (typeof adminHomeCards)[number] }) {
  return (
    <>
      <span className="admin-hub-card-icon" aria-hidden="true">
        {card.icon}
      </span>
      <span className="admin-hub-card-copy">
        <span className="admin-hub-card-status">{card.status}</span>
        <strong>{card.title}</strong>
        <small>{card.description}</small>
      </span>
    </>
  )
}

export function AdminHomePage() {
  return (
    <main className="app-shell admin-shell admin-shop-crud-shell admin-home-shell">
      <AppTopNavigation className="route-navigation" showBack title="운영 관리" showLogo={false} />

      <section className="admin-home-head">
        <span className="eyebrow">ADMIN</span>
        <h1>관리자 메뉴</h1>
        <p>운영 도구는 이 화면에서 확장해요.</p>
      </section>

      <section className="admin-hub-grid" aria-label="관리자 메뉴">
        {adminHomeCards.map((card) =>
          card.href ? (
            <Link className="admin-hub-card" key={card.title} to={card.href}>
              <AdminHubCardContent card={card} />
            </Link>
          ) : (
            <article className="admin-hub-card admin-hub-card-disabled" key={card.title} aria-disabled="true">
              <AdminHubCardContent card={card} />
            </article>
          ),
        )}
      </section>
    </main>
  )
}
