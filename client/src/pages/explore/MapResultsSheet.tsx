import type { ReactNode, RefObject, UIEvent } from 'react'
import type { Shop, ShopImage } from '../../shared/api/types'

type MapResultShop = Shop & {
  distanceLabel?: string | null
}

type MapResultsSheetProps = {
  visible: boolean
  appliedFilters: ReactNode
  visibleShops: MapResultShop[]
  totalShops: number
  isLoading: boolean
  listRef: RefObject<HTMLDivElement | null>
  onScroll: (event: UIEvent<HTMLDivElement>) => void
  onSelectShop: (shopId: number) => void
}

function getSortedShopImages(shop: Shop) {
  return [...shop.images].sort((a, b) => {
    if (a.role !== b.role) {
      return a.role === 'PRIMARY' ? -1 : 1
    }

    return a.sortOrder - b.sortOrder
  })
}

function getShopCategoryLabel(shop: Shop) {
  if (shop.categories.length > 0) {
    return shop.categories.map((category) => category.name).join(' · ')
  }

  return shop.regionName ?? '카테고리 준비 중'
}

function getShopAddressLabel(shop: MapResultShop) {
  return [shop.address, shop.distanceLabel].filter(Boolean).join(' · ')
}

function ShopPhotoStrip({ images, shopName }: { images: ShopImage[]; shopName: string }) {
  if (images.length === 0) {
    return null
  }

  return (
    <div className="map-results-card-media" aria-label={`${shopName} 매장 사진`}>
      {images.slice(0, 4).map((image, index) => (
        <img
          alt={`${shopName} 사진 ${index + 1}`}
          className="map-results-card-photo"
          key={image.id}
          loading="lazy"
          src={image.url}
        />
      ))}
    </div>
  )
}

export function MapResultsSheet({
  visible,
  appliedFilters,
  visibleShops,
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
    <section
      className="map-results-list-panel"
      aria-label="검색 결과"
    >
      <div className="search-result-head">
        <strong>매장목록</strong>
        <small>{totalShops}곳</small>
      </div>

      {appliedFilters ? (
        <div className="map-results-sheet-top">
          {appliedFilters}
        </div>
      ) : null}

      {visibleShops.length === 0 && !isLoading ? (
        <div className="map-list-empty">
          <strong>조건에 맞는 매장이 없습니다.</strong>
          <p>다른 키워드나 태그로 다시 탐색해보세요.</p>
        </div>
      ) : null}

      <div className="map-results-sheet-list" onScroll={onScroll} ref={listRef}>
        {visibleShops.map((shop) => {
          const categoryLabel = getShopCategoryLabel(shop)
          const addressLabel = getShopAddressLabel(shop)
          const images = getSortedShopImages(shop)

          return (
            <button className="map-results-card" key={shop.id} type="button" onClick={() => onSelectShop(shop.id)}>
              <div className="map-results-card-head">
                <strong>{shop.name}</strong>
                <span className="map-results-card-score">
                  {shop.averageRating != null ? (
                    <span className="map-results-card-rating" aria-label={`평점 ${shop.averageRating.toFixed(1)}`}>
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="m12 3 2.6 5.5 6 .9-4.3 4.2 1 6-5.3-2.9-5.3 2.9 1-6-4.3-4.2 6-.9L12 3Z" />
                      </svg>
                      {shop.averageRating.toFixed(1)}
                    </span>
                  ) : null}
                  <span className="map-results-card-review-count">리뷰 {shop.reviewCount}개</span>
                </span>
              </div>
              <div className="map-results-card-meta">
                <span>{categoryLabel}</span>
              </div>
              {addressLabel ? <p className="map-results-card-address">{addressLabel}</p> : null}
              <ShopPhotoStrip images={images} shopName={shop.name} />
            </button>
          )
        })}

        {visibleShops.length < totalShops ? (
          <div className="map-results-sheet-loading">
            <span>{visibleShops.length} / {totalShops}</span>
            <p>아래로 내리면 다음 매장을 이어서 불러옵니다.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
