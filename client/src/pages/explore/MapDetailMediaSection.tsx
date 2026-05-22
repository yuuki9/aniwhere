import type { PointerEvent } from 'react'
import noImageStore from '../../assets/images/explore-no-image-store.png'
import type { Shop } from '../../shared/api/types'

type MapDetailMediaItem = {
  id: string
  src: string
  alt: string
}

type MapDetailMediaSectionProps = {
  shop: Shop
  tone: string
  detailMediaItems: MapDetailMediaItem[]
  totalMediaCount: number
  onDragHandlePointerCancel: () => void
  onDragHandlePointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onDragHandlePointerMove: (event: PointerEvent<HTMLDivElement>) => void
  onDragHandlePointerUp: (event: PointerEvent<HTMLDivElement>) => void
}

export function MapDetailMediaSection({
  shop,
  tone,
  detailMediaItems,
  totalMediaCount,
  onDragHandlePointerCancel,
  onDragHandlePointerDown,
  onDragHandlePointerMove,
  onDragHandlePointerUp,
}: MapDetailMediaSectionProps) {
  const hasMedia = detailMediaItems.length > 0
  const isSingleMedia = detailMediaItems.length === 1
  const secondaryMediaItems = detailMediaItems.slice(1)

  return (
    <section
      className={[
        'map-sheet-media',
        `map-sheet-media-${tone}`,
        !hasMedia ? 'map-sheet-media-empty' : '',
        isSingleMedia ? 'map-sheet-media-single' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className="map-sheet-expanded-drag-handle"
        aria-hidden="true"
        onPointerCancel={onDragHandlePointerCancel}
        onPointerDown={onDragHandlePointerDown}
        onPointerMove={onDragHandlePointerMove}
        onPointerUp={onDragHandlePointerUp}
      >
        <span />
      </div>

      {hasMedia ? (
        <div className="map-sheet-media-grid">
          <article className="map-sheet-media-main">
            <img className="map-sheet-media-image" src={detailMediaItems[0].src} alt={detailMediaItems[0].alt} />
            <div className="map-sheet-media-image-overlay">
              <span className="map-sheet-media-badge">{shop.regionName ?? 'ANIWHERE'}</span>
              <strong>{shop.categories[0]?.name ?? '매장 이미지'}</strong>
            </div>
          </article>

          {secondaryMediaItems.length > 0 ? (
            <div className="map-sheet-media-stack">
              {secondaryMediaItems.map((item, index) => (
                <article className="map-sheet-media-tile" key={item.id}>
                  <img className="map-sheet-media-image" src={item.src} alt={item.alt} />
                  {index === secondaryMediaItems.length - 1 ? (
                    <div className="map-sheet-media-count">
                      <strong>{totalMediaCount > detailMediaItems.length ? `${totalMediaCount}장` : `${detailMediaItems.length}장`}</strong>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="map-sheet-media-fallback" aria-label="매장 이미지 준비 중">
          <img className="map-sheet-no-image-image" src={noImageStore} alt="" aria-hidden="true" />
        </div>
      )}
    </section>
  )
}
