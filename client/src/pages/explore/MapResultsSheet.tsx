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
  reviewPhotosByShopId?: Record<number, MapResultReviewPhoto[]>
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

function getShopCategoryLabels(shop: Shop) {
  if (shop.categories.length > 0) {
    return shop.categories.map((category) => category.name)
  }

  return [shop.regionName ?? '카테고리 준비 중']
}

function getShopAddressLabel(shop: MapResultShop) {
  return [shop.address, shop.distanceLabel].filter(Boolean).join(' · ')
}

function PhotoMoreOverlay({ count }: { count: number }) {
  return (
    <span className="map-photo-more-overlay" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M4.75 7.75A2.75 2.75 0 0 1 7.5 5h9A2.75 2.75 0 0 1 19.25 7.75v8.5A2.75 2.75 0 0 1 16.5 19h-9a2.75 2.75 0 0 1-2.75-2.75v-8.5Z" />
        <path d="m7.5 15 2.25-2.4 1.85 1.9 2.65-3.1L16.5 15H7.5Z" />
        <circle cx="8.4" cy="8.6" r="1.1" />
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
  reviewPhotosByShopId,
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
          const categoryLabels = getShopCategoryLabels(shop)
          const addressLabel = getShopAddressLabel(shop)
          const photos = getResultCardPhotos(shop, reviewPhotosByShopId?.[shop.id])
          const averageRating = shop.averageRating ?? 0

          return (
            <button className="map-results-card" key={shop.id} type="button" onClick={() => onSelectShop(shop.id)}>
              <div className="map-results-card-head">
                <strong>{shop.name}</strong>
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
