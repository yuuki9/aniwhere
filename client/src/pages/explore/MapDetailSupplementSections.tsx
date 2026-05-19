import { Link } from 'react-router-dom'
import type { Shop } from '../../shared/api/types'
import type { MapDetailTab } from './MapDetailSummaryCard'

type MapDetailSupplementSectionsProps = {
  shop: Shop
  activeTab: MapDetailTab
  mediaItems: Array<{
    id: string
    src: string
    alt: string
  }>
}

export function MapDetailSupplementSections({
  shop,
  activeTab,
  mediaItems,
}: MapDetailSupplementSectionsProps) {
  if (activeTab === 'works') {
    return (
      <section className="section map-sheet-info-card map-sheet-tab-panel" id="map-place-works">
        {shop.works.length > 0 ? (
          <div className="map-sheet-token-cloud">
            {shop.works.map((work) => (
              <span className="map-sheet-token-chip" key={work.id}>
                {work.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="map-sheet-footnote">아직 연결된 작품 정보가 없어요.</p>
        )}
      </section>
    )
  }

  if (activeTab === 'photos') {
    return (
      <section className="section map-sheet-info-card map-sheet-tab-panel" id="map-place-photos">
        {mediaItems.length > 0 ? (
          <div className="map-sheet-photo-feed">
            {mediaItems.map((item) => (
              <article className="map-sheet-photo-item" key={item.id}>
                <img src={item.src} alt={item.alt} />
              </article>
            ))}
          </div>
        ) : (
          <p className="map-sheet-footnote">등록된 매장 사진이 없어요.</p>
        )}
      </section>
    )
  }

  if (activeTab === 'review') {
    return (
      <section className="section map-sheet-info-card map-sheet-tab-panel map-place-review-card" id="map-place-review">
        <div className="map-place-review-copy">
          <span>방문 리뷰를 기다리고 있어요.</span>
          <p>다녀온 매장 이야기와 굿즈 정보를 리뷰로 남기면 다음 방문자에게 도움이 돼요.</p>
        </div>
        <Link className="map-place-review-button" to={`/community?shopId=${shop.id}`}>
          리뷰 남기기
        </Link>
      </section>
    )
  }

  return null
}
