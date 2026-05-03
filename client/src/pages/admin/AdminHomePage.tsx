import { Link } from 'react-router-dom'
import { GlobalNavigationMenu } from '../../shared/ui/GlobalNavigationMenu'
import { useAdminOutlet } from './adminOutlet'

export function AdminHomePage() {
  const { lockAdmin } = useAdminOutlet()

  return (
    <main className="app-shell admin-shell">
      <section className="section admin-console-head">
        <div className="map-search-row admin-console-topbar">
          <GlobalNavigationMenu triggerClassName="global-nav-trigger global-nav-trigger-inline" />
          <div className="admin-console-title">
            <span className="eyebrow">ADMIN CONSOLE</span>
            <strong>운영 작업 선택</strong>
          </div>
          <button className="ghost-action compact-action" type="button" onClick={lockAdmin}>
            잠금
          </button>
        </div>
      </section>

      <section className="admin-hub-grid" aria-label="관리자 작업">
        <Link className="section admin-hub-card" to="/admin/shops">
          <span className="eyebrow">SHOP</span>
          <strong>샵 관리</strong>
          <small>매장 등록, 수정, 상태 변경을 처리합니다.</small>
        </Link>
        <Link className="section admin-hub-card" to="/admin/rewards">
          <span className="eyebrow">REWARD</span>
          <strong>포인트 지급</strong>
          <small>검수 후 지급 대기열과 이력을 확인합니다.</small>
        </Link>
      </section>
    </main>
  )
}
