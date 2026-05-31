import type { PointerEvent } from 'react'
import type { Shop } from '../../shared/api/types'

type MapPeekSheetProps = {
  shop: Shop | null
  distanceLabel?: string | null
  isDragging: boolean
  dragOffset: number
  selectionOrigin: 'map' | 'list' | null
  onClick: () => void
  onPointerCancel: () => void
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onPointerUp: (event: PointerEvent<HTMLElement>) => void
}

export function MapPeekSheet({
  shop,
  distanceLabel,
  isDragging,
  dragOffset,
  selectionOrigin,
  onClick,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: MapPeekSheetProps) {
  if (!shop) {
    return null
  }

  const visibleCategories = shop.categories.slice(0, 3)
  const averageRating = shop.averageRating ?? 0

  return (
    <section
      className={[
        'map-bottom-sheet',
        'map-bottom-sheet-peek',
        isDragging ? 'map-bottom-sheet-peek-dragging' : '',
        selectionOrigin === 'list' ? 'map-bottom-sheet-peek-static' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${shop.name} 요약 정보`}
      aria-controls="map-place-detail"
      aria-expanded={false}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
      onClick={onClick}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        transform: dragOffset !== 0 ? `translateY(${dragOffset}px)` : undefined,
      }}
    >
      <div className="map-sheet-peek-trigger" aria-hidden="true">
        <span className="map-bottom-sheet-handle" />
      </div>

      <div className="map-sheet-peek-summary">
        <div className="map-sheet-peek-copy">
          <div className="map-sheet-peek-head">
            <strong>{shop.name}</strong>
          </div>
          <span className="map-sheet-peek-address">
            {shop.address}
            {distanceLabel ? ` · ${distanceLabel}` : ''}
          </span>
          {visibleCategories.length > 0 ? (
            <div className="map-sheet-peek-categories" aria-label="매장 카테고리">
              {visibleCategories.map((category) => (
                <span key={category.id}>{category.name}</span>
              ))}
            </div>
          ) : null}
        </div>
        <span className="map-sheet-peek-score">
          <span className="map-sheet-peek-rating">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m12 3 2.6 5.5 6 .9-4.3 4.2 1 6-5.3-2.9-5.3 2.9 1-6-4.3-4.2 6-.9L12 3Z" />
            </svg>
            <b>{averageRating.toFixed(1)}</b>
          </span>
          <small>리뷰 {shop.reviewCount}개</small>
        </span>
      </div>
    </section>
  )
}
