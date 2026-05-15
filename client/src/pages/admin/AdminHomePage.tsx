import { Link } from 'react-router-dom'
import { AitNavigation } from '../../shared/ui/ait'
import { useAdminOutlet } from './adminOutlet'

export function AdminHomePage() {
  const { lockAdmin } = useAdminOutlet()

  return (
    <main className="app-shell admin-shell">
      <AitNavigation />
      <section className="section admin-console-head">
        <div className="map-search-row admin-console-topbar">
          <div className="admin-console-title">
            <span className="eyebrow">ADMIN CONSOLE</span>
            <strong>관리할 작업을 선택해주세요</strong>
          </div>
          <button className="ghost-action compact-action" type="button" onClick={lockAdmin}>
            잠금
          </button>
        </div>
      </section>

      <section className="admin-hub-grid" aria-label="관리자 작업">
        <Link className="section admin-hub-card" to="/admin/shops">
          <span className="eyebrow">SHOP</span>
          <strong>매장 관리</strong>
          <small>매장 등록, 수정, 상태 변경을 처리해요.</small>
        </Link>
        <Link className="section admin-hub-card" to="/admin/rewards">
          <span className="eyebrow">REWARD</span>
          <strong>포인트 지급</strong>
          <small>검수 후 지급 대기열과 이력을 확인해요.</small>
        </Link>
      </section>
    </main>
  )
}
