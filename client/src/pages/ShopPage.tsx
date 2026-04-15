import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getShop } from '../shared/api/shops'
import { formatDateTime, linkTypeToLabel } from '../shared/lib/format'
import { StatusPill } from '../shared/ui/StatusPill'

export function ShopPage() {
  const { shopId } = useParams()
  const parsedId = Number(shopId)

  const shopQuery = useQuery({
    queryKey: ['shop', parsedId],
    queryFn: () => getShop(parsedId),
    enabled: Number.isFinite(parsedId),
  })

  if (!Number.isFinite(parsedId)) {
    return (
      <main className="app-shell">
        <section className="section">
          <h1>잘못된 매장 경로입니다.</h1>
          <Link className="text-link" to="/">
            탐색 화면으로 이동
          </Link>
        </section>
      </main>
    )
  }

  const shop = shopQuery.data

  return (
    <main className="app-shell">
      <section className="section top-bar">
        <Link className="text-link" to="/explore">
          탐색으로
        </Link>
        <Link className="ghost-action compact-action" to="/community">
          커뮤니티
        </Link>
      </section>

      {shopQuery.isLoading ? <p className="section">매장 정보를 불러오는 중입니다.</p> : null}
      {shopQuery.isError ? (
        <p className="section error-text">{(shopQuery.error as Error).message}</p>
      ) : null}

      {shop ? (
        <>
          <section className="launch-panel shop-hero">
            <div className="launch-copy shop-hero-copy">
              <span className="eyebrow">{shop.regionName ?? `지역 ${shop.regionId ?? '-'}`}</span>
              <h1>{shop.name}</h1>
              <p>{shop.address}</p>
              <div className="chip-row">
                {(shop.categories.length > 0 ? shop.categories : ['미분류']).map((tag) => (
                  <span className="mini-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="shop-hero-side">
              <StatusPill status={shop.status} />
              <div className="hero-stat-card">
                <span className="section-label">방문 전 체크</span>
                <strong>{shop.floor ? `${shop.floor}층` : '층 정보 없음'}</strong>
                <p>외부 링크 {shop.links.length}개 · 취급 작품 {shop.works.length}개</p>
              </div>
            </div>
          </section>

          <section className="detail-grid">
            <article className="section detail-card">
              <span className="section-label">SUMMARY</span>
              <h2>이 매장은 어떤 곳인가요?</h2>
              <p>{shop.description ?? '설명 정보가 아직 없습니다.'}</p>
              <div className="info-grid">
                <div className="info-cell">
                  <span className="meta-text">지역</span>
                  <strong>{shop.regionName ?? `지역 ${shop.regionId ?? '-'}`}</strong>
                </div>
                <div className="info-cell">
                  <span className="meta-text">상태</span>
                  <strong>{shop.status}</strong>
                </div>
              </div>
            </article>

            <article className="section detail-card">
              <span className="section-label">WORKS</span>
              <h2>취급 작품</h2>
              <div className="chip-row">
                {(shop.works.length > 0 ? shop.works : ['작품 정보 없음']).map((work) => (
                  <span className="mini-tag" key={work}>
                    {work}
                  </span>
                ))}
              </div>
            </article>

            <article className="section detail-card">
              <span className="section-label">SOURCE</span>
              <h2>공식/외부 링크</h2>
              <div className="source-list">
                {shop.links.length > 0 ? (
                  shop.links.map((item) => (
                    <a
                      className="source-card source-card-rich"
                      href={item.url}
                      key={item.id}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <div className="source-card-header">
                        <strong>{linkTypeToLabel(item.type)}</strong>
                        <span className="meta-text">바로가기</span>
                      </div>
                      <p>{item.url}</p>
                    </a>
                  ))
                ) : (
                  <p>등록된 링크가 없습니다.</p>
                )}
              </div>
            </article>

            <article className="section detail-card">
              <span className="section-label">TIMELINE</span>
              <h2>업데이트 시점</h2>
              <div className="timeline-list">
                <div className="timeline-item">
                  <strong>생성</strong>
                  <p>{formatDateTime(shop.createdAt)}</p>
                </div>
                <div className="timeline-item">
                  <strong>마지막 수정</strong>
                  <p>{formatDateTime(shop.updatedAt)}</p>
                </div>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </main>
  )
}
