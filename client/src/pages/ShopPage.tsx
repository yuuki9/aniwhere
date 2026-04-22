import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getShopPhotos } from '../shared/api/admin'
import { getShop } from '../shared/api/shops'
import { formatDateTime, formatRelativeUpdated, linkTypeToLabel, statusToLabel } from '../shared/lib/format'
import { GlobalNavigationMenu } from '../shared/ui/GlobalNavigationMenu'
import { StatusPill } from '../shared/ui/StatusPill'

function formatFloorLabel(floor: string | null) {
  if (!floor) {
    return '층 정보 확인 필요'
  }

  return floor.endsWith('층') ? floor : `${floor}층`
}

export function ShopPage() {
  const { shopId } = useParams()
  const parsedId = Number(shopId)

  const shopQuery = useQuery({
    queryKey: ['shop', parsedId],
    queryFn: () => getShop(parsedId),
    enabled: Number.isFinite(parsedId),
  })

  const photoQuery = useQuery({
    queryKey: ['admin-shop-photos', parsedId],
    queryFn: () => getShopPhotos(parsedId),
    enabled: Number.isFinite(parsedId),
    staleTime: Infinity,
  })

  const mediaItems = useMemo(() => {
    const uploadedPhotos = photoQuery.data ?? []

    if (uploadedPhotos.length > 0) {
      return uploadedPhotos.slice(0, 5).map((photo, index) => ({
        id: photo.id,
        src: photo.dataUrl,
        alt: `${shopQuery.data?.name ?? '매장'} 사진 ${index + 1}`,
      }))
    }

    if (!shopQuery.data) {
      return []
    }

    return ['hero', 'sub-1', 'sub-2', 'sub-3', 'sub-4'].map((seed, index) => ({
      id: `${shopQuery.data?.id}-${seed}`,
      src: `https://picsum.photos/seed/${encodeURIComponent(`aniwhere-shop-${shopQuery.data?.id}-${seed}`)}/${index === 0 ? 960 : 480}/${index === 0 ? 960 : 480}`,
      alt: `${shopQuery.data?.name ?? '매장'} 기본 이미지 ${index + 1}`,
    }))
  }, [photoQuery.data, shopQuery.data])

  if (!Number.isFinite(parsedId)) {
    return (
      <main className="app-shell shop-detail-shell">
        <section className="section">
          <h1>잘못된 매장 경로입니다.</h1>
          <Link className="text-link" to="/explore">
            탐색 화면으로 돌아가기
          </Link>
        </section>
      </main>
    )
  }

  const shop = shopQuery.data

  return (
    <main className="app-shell shop-detail-shell">
      <section className="section shop-detail-topbar">
        <div className="shop-detail-topbar-left">
          <Link className="shop-detail-back" to="/explore">
            ←
          </Link>
          <strong>매장 상세</strong>
        </div>
        <GlobalNavigationMenu />
      </section>

      {shopQuery.isLoading ? <p className="section">매장 정보를 불러오는 중입니다.</p> : null}
      {shopQuery.isError ? <p className="section error-text">{(shopQuery.error as Error).message}</p> : null}

      {shop ? (
        <>
          <section className="section shop-detail-media-section">
            <div className="shop-detail-media-grid">
              {mediaItems[0] ? (
                <article className="shop-detail-media-main">
                  <img alt={mediaItems[0].alt} src={mediaItems[0].src} />
                </article>
              ) : null}
              <div className="shop-detail-media-stack">
                {mediaItems.slice(1, 5).map((item) => (
                  <article className="shop-detail-media-tile" key={item.id}>
                    <img alt={item.alt} src={item.src} />
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="section shop-detail-summary-card">
            <div className="shop-detail-summary-head">
              <div>
                <span className="eyebrow">{shop.regionName ?? `지역 ${shop.regionId ?? '-'}`}</span>
                <h1>{shop.name}</h1>
                <p>
                  {shop.categories.length > 0 ? shop.categories.join(' · ') : '카테고리 확인 중'}
                  {shop.sellsIchibanKuji ? ' · 일번쿠지 취급' : ''}
                </p>
              </div>
              <StatusPill status={shop.status} />
            </div>

            <div className="shop-detail-summary-meta">
              <span>{statusToLabel(shop.status)}</span>
              <span>{formatFloorLabel(shop.floor)}</span>
              <span>{formatRelativeUpdated(shop.updatedAt)}</span>
            </div>

            {shop.visitTip || shop.description ? (
              <div className="shop-detail-summary-ai">
                <strong>AI 요약 정보</strong>
                <p>{shop.visitTip ?? shop.description}</p>
              </div>
            ) : null}
          </section>

          <section className="section shop-detail-info-card">
            <div className="shop-detail-info-list">
              <div>
                <span>주소</span>
                <strong>{shop.address}</strong>
              </div>
              <div>
                <span>운영 상태</span>
                <strong>{statusToLabel(shop.status)}</strong>
              </div>
              <div>
                <span>방문 팁</span>
                <strong>{shop.visitTip ?? '등록된 방문 팁이 없습니다.'}</strong>
              </div>
              <div>
                <span>업데이트</span>
                <strong>{formatDateTime(shop.updatedAt)}</strong>
              </div>
            </div>
          </section>

          {shop.works.length > 0 ? (
            <section className="section shop-detail-works-card">
              <div className="section-header">
                <div>
                  <h2>취급 작품</h2>
                </div>
                <span className="meta-text">{shop.works.length}개</span>
              </div>
              <div className="chip-row">
                {shop.works.map((work) => (
                  <span className="mini-tag" key={work}>
                    {work}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <section className="section shop-detail-links-card">
            <div className="section-header">
              <div>
                <h2>공식 / 외부 링크</h2>
              </div>
            </div>
            <div className="source-list">
              {shop.links.length > 0 ? (
                shop.links.map((item) => (
                  <a className="source-card source-card-rich" href={item.url} key={item.id} rel="noreferrer" target="_blank">
                    <div className="source-card-header">
                      <strong>{linkTypeToLabel(item.type)}</strong>
                      <span className="meta-text">바로가기</span>
                    </div>
                    <p>{item.url}</p>
                  </a>
                ))
              ) : (
                <p className="meta-text">등록된 외부 링크가 없습니다.</p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </main>
  )
}
