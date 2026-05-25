import { useEffect, useRef, useState } from 'react'
import type { Shop } from '../../shared/api/types'

export type MapDetailTab = 'info' | 'works' | 'photos' | 'review'

type MapDetailSummaryCardProps = {
  shop: Shop
  activeTab: MapDetailTab
  photoCount: number
  onTabChange: (tab: MapDetailTab) => void
}

export function MapDetailSummaryCard({
  shop,
  activeTab,
  photoCount,
  onTabChange,
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
      <div className="map-sheet-identity-copy">
        <h1>{shop.name}</h1>
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
