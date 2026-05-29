import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getShopPhotos } from '../shared/api/admin'
import { addFavoriteShop, getShop, removeFavoriteShop } from '../shared/api/shops'
import { listShopReviews } from '../shared/api/shopReviews'
import { formatDateTime, formatRelativeUpdated, linkTypeToLabel, statusToLabel } from '../shared/lib/format'
import { getStoredAccessToken } from '../shared/lib/authSession'
import { StatusPill } from '../shared/ui/StatusPill'
import { AppTopNavigation } from '../shared/ui/AppTopNavigation'
import { Toast } from '@aniwhere/tds-mobile'

function formatFloorLabel(floor: string | null) {
  if (!floor) {
    return '층 정보 확인 필요'
  }

  return floor.endsWith('층') ? floor : `${floor}층`
}

export function ShopPage() {
  const { shopId } = useParams()
  const parsedId = Number(shopId)
  const [favoriteState, setFavoriteState] = useState<{ shopId: number; isFavorite: boolean } | null>(null)
  const [favoriteToast, setFavoriteToast] = useState<string | null>(null)

  useEffect(() => {
    document.body.classList.add('shop-detail-route-body')

    return () => {
      document.body.classList.remove('shop-detail-route-body')
    }
  }, [])

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

  const reviewsQuery = useQuery({
    queryKey: ['shop-reviews', parsedId, 'NEWEST'],
    queryFn: () => listShopReviews(parsedId, { page: 0, size: 3, sort: 'NEWEST' }),
    enabled: Number.isFinite(parsedId),
  })

  const favoriteShopMutation = useMutation({
    mutationFn: ({ shopId, nextFavorite }: { shopId: number; nextFavorite: boolean }) =>
      nextFavorite ? addFavoriteShop(shopId) : removeFavoriteShop(shopId),
    onSuccess: (_result, variables) => {
      const nextFavorite = variables.nextFavorite
      setFavoriteState({ shopId: variables.shopId, isFavorite: nextFavorite })
      setFavoriteToast(nextFavorite ? '관심 매장에 저장했어요.' : '관심 매장에서 해제했어요.')
    },
    onError: (error) => {
      setFavoriteToast(error instanceof Error ? error.message : '관심 매장을 저장하지 못했어요.')
    },
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
        <AppTopNavigation showBack />
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
  const isFavoriteShop = shop != null && favoriteState?.shopId === shop.id ? favoriteState.isFavorite : false

  const handleFavoriteClick = () => {
    if (!shop || favoriteShopMutation.isPending) {
      return
    }

    if (!getStoredAccessToken()) {
      setFavoriteToast('로그인 후 관심 매장을 저장할 수 있어요.')
      return
    }

    favoriteShopMutation.mutate({ shopId: shop.id, nextFavorite: !isFavoriteShop })
  }

  return (
    <main className="app-shell shop-detail-shell">
      <AppTopNavigation showBack />
      <Toast
        higherThanCTA
        open={favoriteToast != null}
        text={favoriteToast ?? ''}
        onClose={() => setFavoriteToast(null)}
      />

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
                  {shop.categories.length > 0 ? shop.categories.map((category) => category.name).join(' · ') : '카테고리 확인 중'}
                </p>
              </div>
              <div className="shop-detail-summary-actions">
                <StatusPill status={shop.status} />
                <button
                  aria-label={isFavoriteShop ? '관심 매장 해제' : '관심 매장 추가'}
                  aria-pressed={isFavoriteShop}
                  className="shop-detail-favorite-button"
                  data-favorite={isFavoriteShop ? 'true' : 'false'}
                  disabled={favoriteShopMutation.isPending}
                  type="button"
                  onClick={handleFavoriteClick}
                >
                  <svg className="shop-detail-favorite-icon" aria-hidden="true" fill="none" viewBox="0 0 24 24">
                    <path d="M12 20s-7-4.4-9.2-9.2C1.2 7.3 3.4 4 6.9 4c2 0 3.5 1 4.3 2.4C12 5 13.5 4 15.5 4c3.5 0 5.7 3.3 4.1 6.8C19 15.6 12 20 12 20Z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="shop-detail-summary-meta">
              <span>{statusToLabel(shop.status)}</span>
              <span>{formatFloorLabel(shop.floor)}</span>
              <span>
                {shop.averageRating != null ? `평점 ${shop.averageRating.toFixed(1)}` : '평점 준비 중'} · 리뷰 {shop.reviewCount}
              </span>
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
                  <span className="mini-tag" key={work.id}>
                    {work.name}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <section className="section shop-detail-reviews-card">
            <div className="section-header">
              <div>
                <h2>방문 리뷰</h2>
              </div>
              <span className="meta-text">{shop.reviewCount}개</span>
            </div>
            {reviewsQuery.isLoading ? <p className="meta-text">리뷰를 불러오는 중입니다.</p> : null}
            {reviewsQuery.isError ? (
              <p className="error-text">{(reviewsQuery.error as Error).message}</p>
            ) : null}
            {reviewsQuery.data?.content.length === 0 ? (
              <p className="meta-text">아직 등록된 방문 리뷰가 없습니다.</p>
            ) : null}
            {reviewsQuery.data?.content.length ? (
              <div className="source-list">
                {reviewsQuery.data.content.map((review) => (
                  <article className="source-card source-card-rich" key={review.id}>
                    <div className="source-card-header">
                      <strong>{review.authorNickname}</strong>
                      <span className="meta-text">
                        별점 {review.rating} · 좋아요 {review.likeCount}
                      </span>
                    </div>
                    <p>{review.content}</p>
                    {review.createdAt ? <p>{formatDateTime(review.createdAt)}</p> : null}
                  </article>
                ))}
              </div>
            ) : null}
          </section>

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
