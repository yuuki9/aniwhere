import type { RefObject } from 'react'

type ExploreTopSearchProps = {
  attachTriggerRef: boolean
  filterTriggerRef: RefObject<HTMLButtonElement | null>
  isFilterSheetOpen: boolean
  appliedFilterCount: number
  onHomeClick: () => void
  onSearchClick: () => void
  onFilterClick: () => void
}

export function ExploreTopSearch({
  attachTriggerRef,
  filterTriggerRef,
  isFilterSheetOpen,
  appliedFilterCount,
  onHomeClick,
  onSearchClick,
  onFilterClick,
}: ExploreTopSearchProps) {
  return (
    <div className="map-search-row search-screen-toolrow">
      <button
        className="search-screen-icon map-search-home-button"
        type="button"
        onClick={onHomeClick}
        aria-label="홈으로 이동"
      >
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="m15 6-6 6 6 6" />
        </svg>
      </button>
      <button className="search-screen-bar map-search-field" type="button" onClick={onSearchClick}>
        <span className="map-search-field-copy">매장, 작품, 지역 검색</span>
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="6" />
          <path d="m16 16 4 4" />
        </svg>
      </button>
      <button
        className="search-filter-button map-filter-button"
        type="button"
        ref={attachTriggerRef ? filterTriggerRef : null}
        onClick={onFilterClick}
        aria-controls="search-filter-sheet"
        aria-expanded={isFilterSheetOpen}
        aria-label={appliedFilterCount > 0 ? `필터 ${appliedFilterCount}개 적용됨` : '필터 열기'}
      >
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M4 7h10" />
          <path d="M18 7h2" />
          <path d="M4 17h2" />
          <path d="M10 17h10" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="8" cy="17" r="2" />
        </svg>
        {appliedFilterCount > 0 ? <small>{appliedFilterCount}</small> : null}
      </button>
    </div>
  )
}
