import type { ReactNode, RefObject, UIEvent } from 'react'
import type { Shop } from '../../shared/api/types'

type MapResultShop = Shop & {
  distanceLabel?: string | null
}

type MapResultPhoto = {
  id: string
  url: string
  alt: string
  kind: 'shop' | 'review'
  registeredAt: number
  sortOrder: number
}

export type MapResultReviewPhoto = {
  id: string
  url: string
  alt: string
  kind: 'review'
  registeredAt: number
  sortOrder: number
}

type MapResultsSheetProps = {
  visible: boolean
  appliedFilters: ReactNode
  visibleShops: MapResultShop[]
  favoriteShopIds?: Set<number>
  reviewPhotosByShopId?: Record<number, MapResultReviewPhoto[]>
  workTypeLabelsByShopId?: Record<number, string[]>
  totalShops: number
  isLoading: boolean
  listRef: RefObject<HTMLDivElement | null>
  onScroll: (event: UIEvent<HTMLDivElement>) => void
  onSelectShop: (shopId: number) => void
}

function getResultCardPhotos(shop: MapResultShop, reviewPhotos: MapResultReviewPhoto[] = []) {
  const shopRegisteredAt = Date.parse(shop.updatedAt || shop.createdAt) || 0
  const shopPhotos: MapResultPhoto[] = [...shop.images]
    .sort((a, b) => {
      if (a.role !== b.role) {
        return a.role === 'PRIMARY' ? -1 : 1
      }

      return a.sortOrder - b.sortOrder
    })
    .map((image, index) => ({
      id: `shop-${shop.id}-${image.id ?? index}`,
      url: image.url,
      alt: `${shop.name} 매장 사진 ${index + 1}`,
      kind: 'shop',
      registeredAt: shopRegisteredAt,
      sortOrder: image.sortOrder,
    }))

  return [...shopPhotos, ...reviewPhotos].sort((a, b) => {
    if (a.registeredAt !== b.registeredAt) {
      return b.registeredAt - a.registeredAt
    }

    if (a.kind !== b.kind) {
      return a.kind === 'shop' ? -1 : 1
    }

    return a.sortOrder - b.sortOrder
  })
}

function getShopCategoryLabels(shop: Shop, workTypeLabels: string[] = []) {
  const labels = [
    ...shop.categories.map((category) => category.name),
    ...workTypeLabels,
  ]

  if (labels.length > 0) {
    return labels
  }

  return [shop.regionName ?? '카테고리 준비 중']
}

function getShopAddressLabel(shop: MapResultShop) {
  return [shop.address, shop.distanceLabel].filter(Boolean).join(' · ')
}

function PhotoMoreOverlay({ count }: { count: number }) {
  return (
    <span className="map-photo-more-overlay" aria-hidden="true">
      <svg className="map-photo-more-icon" viewBox="0 0 24 24">
        <path d="M4.5 8.25A2.25 2.25 0 0 1 6.75 6h2.1l1.15-1.55h4L15.15 6h2.1a2.25 2.25 0 0 1 2.25 2.25v7.5A2.25 2.25 0 0 1 17.25 18h-10.5A2.25 2.25 0 0 1 4.5 15.75v-7.5Z" />
        <circle cx="12" cy="12.5" r="3" />
      </svg>
      <strong>더보기 {count}개</strong>
    </span>
  )
}

function ShopPhotoStrip({ photos, shopName }: { photos: MapResultPhoto[]; shopName: string }) {
  if (photos.length === 0) {
    return null
  }

  const visiblePhotos = photos.length >= 5 ? photos.slice(0, 4) : photos
  const hiddenPhotoCount = photos.length >= 5 ? photos.length - (visiblePhotos.length - 1) : 0

  return (
    <div className="map-results-card-media" aria-label={`${shopName} 매장 사진`}>
      {visiblePhotos.map((photo, index) => {
        const isMoreTile = photos.length >= 5 && index === visiblePhotos.length - 1

        return (
          <span className="map-results-card-photo-frame" key={photo.id}>
            <img
              alt={photo.alt}
              className="map-results-card-photo"
              loading="lazy"
              src={photo.url}
            />
            {isMoreTile ? <PhotoMoreOverlay count={hiddenPhotoCount} /> : null}
          </span>
        )
      })}
    </div>
  )
}

export function MapResultsSheet({
  visible,
  appliedFilters,
  visibleShops,
  favoriteShopIds,
  reviewPhotosByShopId,
  workTypeLabelsByShopId,
  totalShops,
  isLoading,
  listRef,
  onScroll,
  onSelectShop,
}: MapResultsSheetProps) {
  if (!visible) {
    return null
  }

  return (
    <section className="map-results-list-panel" aria-label="검색 결과">
      <div className="search-result-head">
        <strong>매장목록</strong>
        <small>{totalShops}곳</small>
      </div>

      {appliedFilters ? <div className="map-results-sheet-top">{appliedFilters}</div> : null}

      {visibleShops.length === 0 && !isLoading ? (
        <div className="map-list-empty">
          <strong>조건에 맞는 매장이 없습니다.</strong>
          <p>다른 키워드나 태그로 다시 탐색해보세요.</p>
        </div>
      ) : null}

      <div className="map-results-sheet-list" onScroll={onScroll} ref={listRef}>
        {visibleShops.map((shop) => {
          const categoryLabels = getShopCategoryLabels(shop, workTypeLabelsByShopId?.[shop.id])
          const addressLabel = getShopAddressLabel(shop)
          const photos = getResultCardPhotos(shop, reviewPhotosByShopId?.[shop.id])
          const averageRating = shop.averageRating ?? 0
          const isFavoriteShop = favoriteShopIds?.has(shop.id) === true

          return (
            <button className="map-results-card" key={shop.id} type="button" onClick={() => onSelectShop(shop.id)}>
              <div className="map-results-card-head">
                <span className="map-results-card-title">
                  {isFavoriteShop ? (
                    <svg className="map-results-card-favorite" aria-label="관심 매장" viewBox="0 0 24 24">
                      <path d="M12 20.3 10.9 19.3C5.4 14.3 2 11.2 2 7.4 2 4.3 4.4 2 7.5 2c1.7 0 3.4.8 4.5 2.1C13.1 2.8 14.8 2 16.5 2 19.6 2 22 4.3 22 7.4c0 3.8-3.4 6.9-8.9 11.9L12 20.3Z" />
                    </svg>
                  ) : null}
                  <strong>{shop.name}</strong>
                </span>
                <span className="map-results-card-score">
                  <span className="map-results-card-rating" aria-label={`평점 ${averageRating.toFixed(1)}`}>
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="m12 3 2.6 5.5 6 .9-4.3 4.2 1 6-5.3-2.9-5.3 2.9 1-6-4.3-4.2 6-.9L12 3Z" />
                    </svg>
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="map-results-card-review-count">리뷰 {shop.reviewCount}개</span>
                </span>
              </div>
              <div className="map-results-card-meta" aria-label="매장 카테고리">
                {categoryLabels.slice(0, 3).map((categoryLabel) => (
                  <span key={categoryLabel}>{categoryLabel}</span>
                ))}
              </div>
              {addressLabel ? <p className="map-results-card-address">{addressLabel}</p> : null}
              <ShopPhotoStrip photos={photos} shopName={shop.name} />
            </button>
          )
        })}

        {visibleShops.length < totalShops ? (
          <div className="map-results-sheet-loading">
            <span>
              {visibleShops.length} / {totalShops}
            </span>
            <p>아래로 내리면 다음 매장을 이어서 불러옵니다.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
