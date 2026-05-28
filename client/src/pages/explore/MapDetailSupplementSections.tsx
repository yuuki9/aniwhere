import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Shop } from '../../shared/api/types'
import type { MapDetailTab } from './MapDetailSummaryCard'

const WORK_FEED_PREVIEW_LIMIT = 5

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
  const [expandedWorkFeedShopId, setExpandedWorkFeedShopId] = useState<number | null>(null)
  const isWorkFeedExpanded = expandedWorkFeedShopId === shop.id
  const visibleWorks = isWorkFeedExpanded ? shop.works : shop.works.slice(0, WORK_FEED_PREVIEW_LIMIT)
  const hiddenWorkCount = Math.max(0, shop.works.length - WORK_FEED_PREVIEW_LIMIT)

  if (activeTab === 'works') {
    return (
      <section className="section map-sheet-info-card map-sheet-tab-panel" id="map-place-works">
        {shop.works.length > 0 ? (
          <div className="map-sheet-work-feed" aria-label={`취급 작품 ${shop.works.length}개`}>
            <div className="map-sheet-work-feed-head">
              <strong>취급 작품</strong>
              <span>{shop.works.length}개</span>
            </div>
            <div className="map-sheet-work-list">
              {visibleWorks.map((work) => (
                <Link
                  className="map-sheet-work-row"
                  key={work.id}
                  to={`/search?scope=work&keyword=${encodeURIComponent(work.name)}`}
                >
                  {work.coverUrl ? (
                    <img
                      className="map-sheet-work-cover"
                      src={work.coverUrl}
                      alt={`${work.name} 포스터`}
                      loading="lazy"
                    />
                  ) : (
                    <span className="map-sheet-work-cover map-sheet-work-cover-fallback" aria-hidden="true">
                      {work.name.trim().slice(0, 1) || '?'}
                    </span>
                  )}
                  <span className="map-sheet-work-copy">
                    <strong>{work.name}</strong>
                    <span>이 작품으로 매장 더 보기</span>
                  </span>
                  <span className="map-sheet-work-action" aria-hidden="true">
                    ›
                  </span>
                </Link>
              ))}
            </div>
            {hiddenWorkCount > 0 ? (
              <button
                className="map-sheet-work-more"
                type="button"
                aria-expanded={isWorkFeedExpanded}
                onClick={() => setExpandedWorkFeedShopId(isWorkFeedExpanded ? null : shop.id)}
              >
                {isWorkFeedExpanded ? '접기' : `작품 ${hiddenWorkCount}개 더 보기`}
              </button>
            ) : null}
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
          <span>{shop.reviewCount > 0 ? `방문 리뷰 ${shop.reviewCount}개` : '방문 리뷰를 기다리고 있어요.'}</span>
          <p>
            {shop.averageRating != null
              ? `평균 별점 ${shop.averageRating.toFixed(1)}점이에요.`
              : '다녀온 매장 이야기와 굿즈 정보를 리뷰로 남기면 다음 방문자에게 도움이 돼요.'}
          </p>
        </div>
        <Link className="map-place-review-button" to={`/shop/detail/${shop.id}`}>
          리뷰 보기
        </Link>
      </section>
    )
  }

  return null
}
