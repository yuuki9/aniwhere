import type { Shop } from '../../shared/api/types'
import { GlobalNavigationMenu } from '../../shared/ui/GlobalNavigationMenu'

type MapDetailMediaItem = {
  id: string
  src: string
  alt: string
}

type MapDetailMediaSectionProps = {
  shop: Shop
  tone: string
  detailMediaItems: MapDetailMediaItem[]
  onBack: () => void
  onClose: () => void
}

export function MapDetailMediaSection({
  shop,
  tone,
  detailMediaItems,
  onBack,
  onClose,
}: MapDetailMediaSectionProps) {
  return (
    <section className={`map-sheet-media map-sheet-media-${tone}`}>
      <div className="map-sheet-media-topbar">
        <div className="map-sheet-topbar-actions">
          <button
            className="map-sheet-icon-button map-sheet-icon-button-overlay"
            type="button"
            onClick={onBack}
            aria-label="뒤로 가기"
          >
            ←
          </button>
          <GlobalNavigationMenu triggerClassName="global-nav-trigger global-nav-trigger-overlay" />
        </div>
        <div className="map-sheet-topbar-actions">
          <button
            className="map-sheet-icon-button map-sheet-icon-button-overlay"
            type="button"
            onClick={onClose}
            aria-label="상세 화면 닫기"
          >
            ×
          </button>
        </div>
      </div>

      {detailMediaItems.length > 0 ? (
        <div className="map-sheet-media-grid">
          <article className="map-sheet-media-main">
            <img className="map-sheet-media-image" src={detailMediaItems[0].src} alt={detailMediaItems[0].alt} />
            <div className="map-sheet-media-image-overlay">
              <span className="map-sheet-media-badge">{shop.regionName ?? 'ANIWHERE'}</span>
              <strong>{shop.categories[0] ?? shop.works[0] ?? '매장 큐레이션'}</strong>
            </div>
          </article>

          <div className="map-sheet-media-stack">
            {detailMediaItems.slice(1).map((item, index) => (
              <article className="map-sheet-media-tile" key={item.id}>
                <img className="map-sheet-media-image" src={item.src} alt={item.alt} />
                {index === detailMediaItems.slice(1).length - 1 ? (
                  <div className="map-sheet-media-count">
                    <strong>+{detailMediaItems.length}</strong>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
