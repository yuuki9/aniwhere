import { Link } from 'react-router-dom'
import type { Shop } from '../../shared/api/types'
import { linkTypeToLabel } from '../../shared/lib/format'
import { MapDetailIcon } from '../../shared/ui/mapDetailIcons'

type MapDetailSupplementSectionsProps = {
  shop: Shop
  relatedShops: Shop[]
  onSelectRelatedShop: (shopId: number) => void
}

export function MapDetailSupplementSections({
  shop,
  relatedShops,
  onSelectRelatedShop,
}: MapDetailSupplementSectionsProps) {
  return (
    <>
      <section className="section map-place-review-card" id="map-place-review">
        <div className="map-place-review-copy">
          <strong>{shop.name}</strong>
          <span>다녀오셨나요?</span>
          <p>방문 팁과 굿즈 정보를 리뷰로 남겨주세요.</p>
        </div>
        <Link className="map-place-review-button" to={`/community?shopId=${shop.id}`}>
          ✎ 리뷰 쓰기
        </Link>
      </section>

      {shop.works.length > 0 ? (
        <section className="section map-sheet-list-card">
          <div className="map-sheet-section-head">
            <strong>취급 작품</strong>
            <span>{shop.works.length}개</span>
          </div>
          <div className="map-sheet-token-cloud">
            {shop.works.slice(0, 8).map((work) => (
              <span className="map-sheet-token-chip" key={work}>
                {work}
              </span>
            ))}
          </div>
          {shop.works.length > 8 ? (
            <p className="map-sheet-footnote">외 {shop.works.length - 8}개</p>
          ) : null}
        </section>
      ) : null}

      {shop.links.length > 0 ? (
        <section className="section map-sheet-link-section-v2">
          <div className="map-sheet-section-head">
            <strong>공식 / 외부 링크</strong>
            <span>{shop.links.length}개</span>
          </div>
          <div className="map-sheet-link-list">
            {shop.links.map((item) => (
              <a className="map-sheet-link-row" href={item.url} key={item.id} rel="noreferrer" target="_blank">
                <span className="map-sheet-link-icon">
                  <MapDetailIcon name="link" />
                </span>
                <div className="map-sheet-link-copy">
                  <strong>{linkTypeToLabel(item.type)}</strong>
                  <p>{item.url}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {relatedShops.length > 0 ? (
        <section className="section map-sheet-section map-sheet-recommend-section">
          <div className="map-sheet-section-head">
            <strong>함께 보면 좋은 장소</strong>
            <span>{relatedShops.length}곳</span>
          </div>

          <div className="map-related-rail">
            {relatedShops.map((relatedShop) => (
              <button
                className="map-related-card"
                key={relatedShop.id}
                type="button"
                onClick={() => onSelectRelatedShop(relatedShop.id)}
              >
                <div className="map-related-card-visual">
                  <span>{relatedShop.categories[0] ?? 'SHOP'}</span>
                </div>
                <div className="map-related-card-copy">
                  <strong>{relatedShop.name}</strong>
                  <p>{relatedShop.regionName ?? `지역 ${relatedShop.regionId ?? '-'}`}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
