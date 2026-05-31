import type { RefObject } from 'react'
import { MapSearchFieldButton } from '../../shared/ui/MapSearchFieldShell'

type ExploreTopSearchProps = {
  attachTriggerRef: boolean
  filterTriggerRef: RefObject<HTMLButtonElement | null>
  isFilterSheetOpen: boolean
  appliedFilterCount: number
  value?: string | null
  onSearchClick: () => void
  onFilterClick: () => void
}

export function ExploreTopSearch({
  attachTriggerRef,
  filterTriggerRef,
  isFilterSheetOpen,
  appliedFilterCount,
  value,
  onSearchClick,
  onFilterClick,
}: ExploreTopSearchProps) {
  return (
    <div className="map-search-row search-screen-toolrow">
      <MapSearchFieldButton value={value} onClick={onSearchClick} />
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
