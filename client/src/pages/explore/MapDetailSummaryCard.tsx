import { useEffect, useRef, useState } from 'react'
import type { Shop } from '../../shared/api/types'

export type MapDetailTab = 'info' | 'works' | 'photos' | 'review'

type MapDetailSummaryCardProps = {
  shop: Shop
  description: string | null
  activeTab: MapDetailTab
  photoCount: number
  onTabChange: (tab: MapDetailTab) => void
}

export function MapDetailSummaryCard({
  shop,
  description,
  activeTab,
  photoCount,
  onTabChange,
}: MapDetailSummaryCardProps) {
  const [keywordExpansion, setKeywordExpansion] = useState({ isExpanded: false, signature: '' })
  const [shouldShowKeywordMore, setShouldShowKeywordMore] = useState(false)
  const [isAiSummaryExpanded, setIsAiSummaryExpanded] = useState(false)
  const keywordListRef = useRef<HTMLDivElement>(null)
  const keywords = shop.categories.map((category) => category.name).filter(Boolean)
  const keywordSignature = keywords.join('\u0001')
  const isKeywordExpanded = keywordExpansion.signature === keywordSignature && keywordExpansion.isExpanded
  const aiSummary = description?.replace(/\s+/g, ' ').trim() ?? null
  const shouldCollapseAiSummary = aiSummary ? aiSummary.length > 104 : false
  const visibleAiSummary =
    aiSummary && shouldCollapseAiSummary && !isAiSummaryExpanded ? `${aiSummary.slice(0, 104).trimEnd()}…` : aiSummary

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

      {visibleAiSummary ? (
        <div className="map-sheet-ai-summary">
          <div className="map-sheet-ai-summary-head">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 3.75 13.65 8.1 18 9.75l-4.35 1.65L12 15.75l-1.65-4.35L6 9.75l4.35-1.65L12 3.75Z" />
              <path d="M18.25 14.25 19 16.1l1.75.65L19 17.4l-.75 1.85-.75-1.85-1.75-.65 1.75-.65.75-1.85Z" />
              <path d="M5.75 15.25 6.4 16.8l1.6.6-1.6.6-.65 1.55L5.1 18 3.5 17.4l1.6-.6.65-1.55Z" />
            </svg>
            <strong>AI가 요약한 정보</strong>
          </div>
          <p>{visibleAiSummary}</p>
          {shouldCollapseAiSummary ? (
            <button
              className="map-sheet-ai-summary-more"
              type="button"
              aria-expanded={isAiSummaryExpanded}
              onClick={() => setIsAiSummaryExpanded((current) => !current)}
            >
              {isAiSummaryExpanded ? '접기' : '더보기'}
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
