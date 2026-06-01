import { Link } from 'react-router-dom'
import { AppTopNavigation } from '../../shared/ui/AppTopNavigation'

const adminHomeCards = [
  {
    description: '등록된 매장을 검수하고 새 매장을 등록해요.',
    href: '/admin/shops',
    icon: '샵',
    status: '바로 처리',
    title: '매장 관리',
  },
]

const pendingAdminCards = [
  {
    description: '방문 리뷰를 확인하고 상태 변경 흐름을 연결해요.',
    href: '/admin/reviews',
    icon: '리',
    status: '다음 연결',
    title: '리뷰 검수',
  },
  {
    description: '사용자 목록과 운영 권한 변경 업무를 모아요.',
    href: '/admin/users',
    icon: '권',
    status: '다음 연결',
    title: '사용자/권한',
  },
  {
    description: '검수 완료 보상과 수동 지급 대기열을 관리해요.',
    href: '/admin/points',
    icon: '포',
    status: '다음 연결',
    title: '포인트 지급',
  },
  {
    description: '현재 운영자 프로필과 접속 상태를 확인해요.',
    href: '/admin/account',
    icon: '계',
    status: '다음 연결',
    title: '계정 정보',
  },
]

type AdminHomeCard = (typeof adminHomeCards)[number] | (typeof pendingAdminCards)[number]

function AdminHubCardContent({ card }: { card: AdminHomeCard }) {
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
        <h1>운영 분기점</h1>
        <p>오늘 처리할 업무를 선택해주세요.</p>
      </section>

      <section className="admin-branch-section" aria-labelledby="admin-primary-branch-title">
        <h2 className="admin-branch-section-title" id="admin-primary-branch-title">
          바로 처리
        </h2>
        <section className="admin-hub-grid" aria-label="바로 처리할 관리자 업무">
          {adminHomeCards.map((card) => (
            <Link className="admin-hub-card admin-branch-card-primary" key={card.title} to={card.href}>
              <AdminHubCardContent card={card} />
            </Link>
          ))}
        </section>
      </section>

      <section className="admin-branch-section" aria-labelledby="admin-pending-branch-title">
        <h2 className="admin-branch-section-title" id="admin-pending-branch-title">
          다음 연결
        </h2>
        <section className="admin-hub-grid" aria-label="연결된 관리자 업무">
          {pendingAdminCards.map((card) => (
            <Link
              className="admin-hub-card admin-branch-card-pending"
              key={card.title}
              to={card.href}
            >
              <AdminHubCardContent card={card} />
            </Link>
          ))}
        </section>
      </section>
    </main>
  )
}
