import { Link, useNavigate } from 'react-router-dom'

export function CommunityPage() {
  const navigate = useNavigate()

  return (
    <main className="app-shell">
      <section className="section discover-search-entry-section">
        <div className="map-search-row">
          <button className="map-search-field" type="button" onClick={() => navigate('/search')}>
            <span className="map-search-field-copy">리뷰를 볼 매장을 검색해 보세요</span>
            <strong aria-hidden="true">⌕</strong>
          </button>
        </div>
      </section>

      <section className="section editorial-hero">
        <div className="hero-copy">
          <span className="eyebrow">REVIEWS</span>
          <h1>방문 리뷰는 매장별로 정리돼요</h1>
          <p>
            커뮤니티 게시글 API가 매장 리뷰 API로 전환되어, 이제 후기는 각 매장 화면에서 확인하고 남기는 흐름으로 정리합니다.
          </p>
          <div className="hero-action-row">
            <Link className="primary-action" to="/explore?view=list">
              매장 찾아보기
            </Link>
            <Link className="secondary-action" to="/home">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
