import { Link } from 'react-router-dom'
import { AppTopNavigation } from '../shared/ui/AppTopNavigation'

export function PostDetailPage() {
  return (
    <main className="app-shell">
      <AppTopNavigation showBack />
      <section className="section editorial-hero">
        <div className="hero-copy">
          <span className="eyebrow">REVIEWS</span>
          <h1>커뮤니티 게시글은 매장 리뷰로 이전됐어요</h1>
          <p>기존 게시글 상세 API는 제거되어, 방문 후기는 매장 상세 화면의 리뷰 영역에서 다룰 예정입니다.</p>
          <div className="hero-action-row">
            <Link className="primary-action" to="/explore?view=list">
              매장 찾아보기
            </Link>
            <Link className="secondary-action" to="/community">
              리뷰 안내로 이동
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
