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
        <Link className="text-link" to="/">
          목록으로
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
          <section className="launch-panel">
            <div className="launch-copy">
              <span className="eyebrow">
                {shop.regionName ?? `지역 ${shop.regionId ?? '-'}`}
              </span>
              <h1>{shop.name}</h1>
              <p>{shop.address}</p>
            </div>
            <div className="launch-actions">
              <StatusPill status={shop.status} />
              <span className="secondary-action static-panel">
                {shop.floor ? `${shop.floor}층` : '층 정보 없음'}
              </span>
            </div>
          </section>

          <section className="detail-grid">
            <article className="section detail-card">
              <span className="section-label">소개</span>
              <h2>샵 설명</h2>
              <p>{shop.description ?? '설명 정보가 아직 없습니다.'}</p>
              <div className="chip-row">
                {(shop.categories.length > 0 ? shop.categories : ['미분류']).map((tag) => (
                  <span className="mini-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>

            <article className="section detail-card">
              <span className="section-label">작품</span>
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
              <span className="section-label">외부 링크</span>
              <h2>원본 출처</h2>
              <div className="source-list">
                {shop.links.length > 0 ? (
                  shop.links.map((item) => (
                    <a
                      className="source-card"
                      href={item.url}
                      key={item.id}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <strong>{linkTypeToLabel(item.type)}</strong>
                      <p>{item.url}</p>
                    </a>
                  ))
                ) : (
                  <p>등록된 링크가 없습니다.</p>
                )}
              </div>
            </article>

            <article className="section detail-card">
              <span className="section-label">메타데이터</span>
              <h2>업데이트 시점</h2>
              <p>생성: {formatDateTime(shop.createdAt)}</p>
              <p>수정: {formatDateTime(shop.updatedAt)}</p>
            </article>
          </section>
        </>
      ) : null}
    </main>
  )
}
