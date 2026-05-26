import type { ReactNode, RefObject, UIEvent } from 'react'
import type { Shop } from '../../shared/api/types'
import { formatRelativeUpdated } from '../../shared/lib/format'
import { StatusPill } from '../../shared/ui/StatusPill'
import { BottomSheet } from '@aniwhere/tds-mobile'

type MapResultShop = Shop & {
  distanceLabel?: string | null
}

type MapResultsSheetProps = {
  visible: boolean
  topSearch: ReactNode
  appliedFilters: ReactNode
  visibleShops: MapResultShop[]
  totalShops: number
  isLoading: boolean
  listRef: RefObject<HTMLDivElement | null>
  onClose: () => void
  onScroll: (event: UIEvent<HTMLDivElement>) => void
  onSelectShop: (shopId: number) => void
}

export function MapResultsSheet({
  visible,
  topSearch,
  appliedFilters,
  visibleShops,
  totalShops,
  isLoading,
  listRef,
  onClose,
  onScroll,
  onSelectShop,
}: MapResultsSheetProps) {
  return (
    <BottomSheet
      UNSAFE_disableFocusLock
      className="map-results-sheet-v2"
      disableDimmer
      open={visible}
      onClose={onClose}
      ariaLabelledBy="map-results-sheet-title"
    >
      <div className="map-results-sheet-top">
        {topSearch}
        {appliedFilters}
        <h2 className="map-results-sheet-title" id="map-results-sheet-title">
          검색 결과
        </h2>
      </div>

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
    </BottomSheet>
  )
}
