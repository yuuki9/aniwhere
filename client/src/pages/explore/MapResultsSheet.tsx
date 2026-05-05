import type { ReactNode, RefObject, UIEvent } from 'react'
import type { Shop } from '../../shared/api/types'
import { formatRelativeUpdated } from '../../shared/lib/format'
import { StatusPill } from '../../shared/ui/StatusPill'

type MapResultShop = Shop & {
  distanceLabel?: string | null
}

type MapResultsSheetProps = {
  visible: boolean
  topSearch: ReactNode
  visibleShops: MapResultShop[]
  totalShops: number
  isLoading: boolean
  listRef: RefObject<HTMLDivElement | null>
  onScroll: (event: UIEvent<HTMLDivElement>) => void
  onSelectShop: (shopId: number) => void
}

export function MapResultsSheet({
  visible,
  topSearch,
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
    <section className="map-results-sheet-v2" aria-label="검색 결과 목록">
      <div className="map-results-sheet-top">{topSearch}</div>

      {visibleShops.length === 0 && !isLoading ? (
        <div className="map-list-empty">
          <strong>조건에 맞는 매장이 없습니다.</strong>
          <p>다른 키워드나 태그로 다시 탐색해보세요.</p>
        </div>
      ) : null}

      <div className="map-results-sheet-list" onScroll={onScroll} ref={listRef}>
        {visibleShops.map((shop) => (
          <button className="map-results-card" key={shop.id} type="button" onClick={() => onSelectShop(shop.id)}>
            <div className="map-list-item-head">
              <strong>{shop.name}</strong>
              <StatusPill status={shop.status} />
            </div>
            <p>
              {shop.regionName ?? `지역 ${shop.regionId ?? '-'}`} · 작품 {shop.works.length}
              {shop.distanceLabel ? ` · ${shop.distanceLabel}` : ''}
            </p>
            <p className="map-list-item-subtle">{shop.address}</p>
            <p className="map-list-item-subtle">{formatRelativeUpdated(shop.updatedAt)}</p>
          </button>
        ))}

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
