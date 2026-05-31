import { useEffect, useRef, useState } from 'react'
import type { Shop } from '../../shared/api/types'

export type MapDetailTab = 'info' | 'works' | 'photos' | 'review'

type MapDetailTopActionsProps = {
  isFavorite: boolean
  isFavoritePending: boolean
  onToggleFavorite: () => void
  onShare: () => void
}

type MapDetailSummaryCardProps = {
  shop: Shop
  isFavorite: boolean
  isFavoritePending: boolean
  onToggleFavorite: () => void
  onShare: () => void
}

type MapDetailTabsProps = {
  activeTab: MapDetailTab
  photoCount: number
  reviewCount: number
  onTabChange: (tab: MapDetailTab) => void
}

export function MapDetailTopActions({
  isFavorite,
  isFavoritePending,
  onToggleFavorite,
  onShare,
}: MapDetailTopActionsProps) {
  return (
    <div className="map-sheet-expanded-actions" aria-label="매장 액션">
      <button
        aria-label={isFavorite ? '관심 매장 해제' : '관심 매장 추가'}
        aria-pressed={isFavorite}
        className="map-place-favorite-button"
        data-favorite={isFavorite ? 'true' : 'false'}
        disabled={isFavoritePending}
        type="button"
        onClick={onToggleFavorite}
      >
        <svg className="map-place-favorite-icon" aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M12 20s-7-4.4-9.2-9.2C1.2 7.3 3.4 4 6.9 4c2 0 3.5 1 4.3 2.4C12 5 13.5 4 15.5 4c3.5 0 5.7 3.3 4.1 6.8C19 15.6 12 20 12 20Z" />
        </svg>
      </button>
      <button className="map-place-share-button" type="button" aria-label="매장 공유하기" onClick={onShare}>
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M12 4v11" />
          <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
          <path d="M5 13.5v3.75A2.75 2.75 0 0 0 7.75 20h8.5A2.75 2.75 0 0 0 19 17.25V13.5" />
        </svg>
      </button>
    </div>
  )
}

export function MapDetailSummaryCard({
  shop,
  isFavorite,
  isFavoritePending,
  onToggleFavorite,
  onShare,
}: MapDetailSummaryCardProps) {
  const [keywordExpansion, setKeywordExpansion] = useState({ isExpanded: false, signature: '' })
  const [shouldShowKeywordMore, setShouldShowKeywordMore] = useState(false)
  const keywordListRef = useRef<HTMLDivElement>(null)
  const keywords = shop.categories.map((category) => category.name).filter(Boolean)
  const keywordSignature = keywords.join('\u0001')
  const isKeywordExpanded = keywordExpansion.signature === keywordSignature && keywordExpansion.isExpanded
  const averageRating = shop.averageRating ?? 0

  useEffect(() => {
    const keywordList = keywordListRef.current

    if (!keywordList) {
      return
    }

    const measureKeywordOverflow = () => {
      const hasOverflow = keywordList.scrollWidth > keywordList.clientWidth + 1
      setShouldShowKeywordMore((current) => (isKeywordExpanded && current ? current : hasOverflow))
    }

    const animationFrame = window.requestAnimationFrame(measureKeywordOverflow)
    const resizeObserver = new ResizeObserver(measureKeywordOverflow)
    resizeObserver.observe(keywordList)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
    }
  }, [isKeywordExpanded, keywordSignature])

  return (
    <section className="section map-sheet-summary-card map-sheet-identity-card" id="map-place-home">
      <div className="map-sheet-identity-copy">
        <div className="map-sheet-identity-title-row">
          <h1>{shop.name}</h1>
          <MapDetailTopActions
            isFavorite={isFavorite}
            isFavoritePending={isFavoritePending}
            onToggleFavorite={onToggleFavorite}
            onShare={onShare}
          />
        </div>
        <div className="map-sheet-identity-rating" aria-label={`평점 ${averageRating.toFixed(1)}, 리뷰 ${shop.reviewCount}`}>
          <span className="map-sheet-identity-rating-score">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m12 3 2.6 5.5 6 .9-4.3 4.2 1 6-5.3-2.9-5.3 2.9 1-6-4.3-4.2 6-.9L12 3Z" />
            </svg>
            <strong>{averageRating.toFixed(1)}</strong>
          </span>
          <span className="map-sheet-identity-rating-divider" aria-hidden="true" />
          <span className="map-sheet-identity-review-count">리뷰 {shop.reviewCount}</span>
        </div>
        {keywords.length > 0 ? (
          <div
            className={['map-sheet-keyword-row', isKeywordExpanded ? 'map-sheet-keyword-row-expanded' : '']
              .filter(Boolean)
              .join(' ')}
            aria-label="매장 카테고리"
          >
            <div className="map-sheet-keyword-list" ref={keywordListRef}>
              {keywords.map((keyword) => (
                <span key={keyword}>{keyword}</span>
              ))}
            </div>
            {shouldShowKeywordMore || isKeywordExpanded ? (
              <button
                className="map-sheet-keyword-more"
                type="button"
                aria-expanded={isKeywordExpanded}
                aria-label={isKeywordExpanded ? '카테고리 접기' : '카테고리 더보기'}
                onClick={() =>
                  setKeywordExpansion({
                    isExpanded: !isKeywordExpanded,
                    signature: keywordSignature,
                  })
                }
              >
                {isKeywordExpanded ? '접기' : '···'}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function MapDetailTabs({ activeTab, photoCount, reviewCount, onTabChange }: MapDetailTabsProps) {
  return (
    <nav
      className={['map-place-tabs', photoCount > 0 ? 'map-place-tabs-four' : ''].filter(Boolean).join(' ')}
      aria-label="상세 정보 탭"
    >
      <button
        className={activeTab === 'info' ? 'map-place-tab-active' : ''}
        type="button"
        aria-current={activeTab === 'info' ? 'page' : undefined}
        onClick={() => onTabChange('info')}
      >
        정보
      </button>
      <button
        className={activeTab === 'review' ? 'map-place-tab-active' : ''}
        type="button"
        aria-current={activeTab === 'review' ? 'page' : undefined}
        onClick={() => onTabChange('review')}
      >
        리뷰 {reviewCount}
      </button>
      {photoCount > 0 ? (
        <button
          className={activeTab === 'photos' ? 'map-place-tab-active' : ''}
          type="button"
          aria-current={activeTab === 'photos' ? 'page' : undefined}
          onClick={() => onTabChange('photos')}
        >
          사진
        </button>
      ) : null}
      <button
        className={activeTab === 'works' ? 'map-place-tab-active' : ''}
        type="button"
        aria-current={activeTab === 'works' ? 'page' : undefined}
        onClick={() => onTabChange('works')}
      >
        취급작품
      </button>
    </nav>
  )
}
