import { useEffect, useRef, useState } from 'react'
import type { Shop } from '../../shared/api/types'

export type MapDetailTab = 'info' | 'works' | 'photos' | 'review'

type MapDetailSummaryCardProps = {
  shop: Shop
  activeTab: MapDetailTab
  isFavorite: boolean
  isFavoritePending: boolean
  photoCount: number
  onTabChange: (tab: MapDetailTab) => void
  onToggleFavorite: () => void
}

export function MapDetailSummaryCard({
  shop,
  activeTab,
  isFavorite,
  isFavoritePending,
  photoCount,
  onTabChange,
  onToggleFavorite,
}: MapDetailSummaryCardProps) {
  const [keywordExpansion, setKeywordExpansion] = useState({ isExpanded: false, signature: '' })
  const [shouldShowKeywordMore, setShouldShowKeywordMore] = useState(false)
  const keywordListRef = useRef<HTMLDivElement>(null)
  const keywords = shop.categories.map((category) => category.name).filter(Boolean)
  const keywordSignature = keywords.join('\u0001')
  const isKeywordExpanded = keywordExpansion.signature === keywordSignature && keywordExpansion.isExpanded

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
      <div className="map-sheet-identity-head">
        <div className="map-sheet-identity-copy">
          <h1>{shop.name}</h1>
        </div>
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
      </div>

      {keywords.length > 0 ? (
        <div
          className={['map-sheet-keyword-row', isKeywordExpanded ? 'map-sheet-keyword-row-expanded' : '']
            .filter(Boolean)
            .join(' ')}
          aria-label="매장 키워드"
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
              aria-label={isKeywordExpanded ? '분류 접기' : '분류 더 보기'}
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

      <nav
        className={['map-place-tabs', photoCount > 5 ? 'map-place-tabs-four' : ''].filter(Boolean).join(' ')}
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
          className={activeTab === 'works' ? 'map-place-tab-active' : ''}
          type="button"
          aria-current={activeTab === 'works' ? 'page' : undefined}
          onClick={() => onTabChange('works')}
        >
          작품
        </button>
        {photoCount > 5 ? (
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
          className={activeTab === 'review' ? 'map-place-tab-active' : ''}
          type="button"
          aria-current={activeTab === 'review' ? 'page' : undefined}
          onClick={() => onTabChange('review')}
        >
          리뷰
        </button>
      </nav>
    </section>
  )
}
