import type { PointerEvent } from 'react'
import type { Shop } from '../../shared/api/types'
import { StatusPill } from '../../shared/ui/StatusPill'

type MapPeekHeroImage = {
  src: string
}

type MapPeekSheetProps = {
  shop: Shop | null
  distanceLabel?: string | null
  heroImage: MapPeekHeroImage | null
  isDragging: boolean
  dragOffset: number
  selectionOrigin: 'map' | 'list' | null
  onClick: () => void
  onOpenDirections: (event?: { stopPropagation: () => void }) => void
  onPointerCancel: () => void
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onPointerUp: (event: PointerEvent<HTMLElement>) => void
}

export function MapPeekSheet({
  shop,
  distanceLabel,
  heroImage,
  isDragging,
  dragOffset,
  selectionOrigin,
  onClick,
  onOpenDirections,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: MapPeekSheetProps) {
  if (!shop) {
    return null
  }

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
            <StatusPill status={shop.status} />
          </div>
          <p>
            {shop.regionName ?? `지역 ${shop.regionId ?? '-'}`}
            {distanceLabel ? ` · ${distanceLabel}` : ''}
          </p>
          <p className="map-sheet-peek-meta">{shop.address}</p>
        </div>
        <button
          className="map-sheet-peek-route"
          type="button"
          onClick={onOpenDirections}
          aria-label={`${shop.name} 네이버 지도 웹 길찾기 열기`}
        >
          {heroImage ? (
            <img src={heroImage.src} alt="" aria-hidden="true" />
          ) : (
            <span aria-hidden="true">{shop.name.slice(0, 1)}</span>
          )}
          <strong aria-hidden="true">↱</strong>
        </button>
      </div>
    </section>
  )
}
