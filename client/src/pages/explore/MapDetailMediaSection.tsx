import noImageStore from '../../assets/images/explore-no-image-store.png'

export type MapDetailMediaItem = {
  id: string
  src: string
  alt: string
  kind?: 'shop' | 'review'
}

type MapDetailMediaSectionProps = {
  detailMediaItems: MapDetailMediaItem[]
  totalMediaCount: number
  onOpenMediaItem?: (item: MapDetailMediaItem, index: number) => void
  onOpenMoreMedia?: () => void
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

export function MapDetailMediaSection({
  detailMediaItems,
  totalMediaCount,
  onOpenMediaItem,
  onOpenMoreMedia,
}: MapDetailMediaSectionProps) {
  const hasMedia = detailMediaItems.length > 0
  const visibleMediaItems = totalMediaCount >= 5 ? detailMediaItems.slice(0, 4) : detailMediaItems
  const hiddenMediaCount = totalMediaCount >= 5 ? totalMediaCount - (visibleMediaItems.length - 1) : 0

  return (
    <section className={['map-sheet-media', !hasMedia ? 'map-sheet-media-empty' : ''].filter(Boolean).join(' ')}>
      {hasMedia ? (
        <div className="map-sheet-media-grid" aria-label="사진">
          {visibleMediaItems.map((item, index) => {
            const isMoreTile = totalMediaCount >= 5 && index === visibleMediaItems.length - 1

            return (
              <button
                className="map-sheet-media-tile"
                key={item.id}
                type="button"
                aria-label={`${item.alt} 보기`}
                onClick={() => {
                  if (isMoreTile) {
                    onOpenMoreMedia?.()
                    return
                  }

                  onOpenMediaItem?.(item, index)
                }}
              >
                <img className="map-sheet-media-image" src={item.src} alt={item.alt} />
                {isMoreTile ? <PhotoMoreOverlay count={hiddenMediaCount} /> : null}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="map-sheet-media-fallback" aria-label="매장 이미지 준비 중">
          <img className="map-sheet-no-image-image" src={noImageStore} alt="" aria-hidden="true" />
        </div>
      )}
    </section>
  )
}
