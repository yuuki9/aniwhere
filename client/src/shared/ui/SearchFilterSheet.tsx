import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@aniwhere/tds-mobile'
import { getShopFacets } from '../api/shops'
import {
  SHOP_FACET_GC_TIME_MS,
  SHOP_FACET_STALE_TIME_MS,
  shopFacetQueryKey,
} from '../lib/shopFacetQuery'
import type { ShopFilters } from '../lib/shopFilters'

type SearchFilterSheetProps = {
  open: boolean
  triggerRef: RefObject<HTMLElement>
  keyword?: string
  selectedFilters: ShopFilters
  viewportBounds?: {
    southWest: {
      latitude: number
      longitude: number
    }
    northEast: {
      latitude: number
      longitude: number
    }
  } | null
  onApplyFilters: (filters: ShopFilters) => void
  onClose: () => void
}

type SearchFilterSheetDialogProps = Omit<SearchFilterSheetProps, 'open'>

export function SearchFilterSheet({ open, ...props }: SearchFilterSheetProps) {
  if (!open) {
    return null
  }

  const draftKey = [
    props.selectedFilters.regionIds.join(','),
    props.selectedFilters.categoryIds.join(','),
    props.selectedFilters.status ?? '',
  ].join('|')

  return <SearchFilterSheetDialog key={draftKey} {...props} />
}

function SearchFilterSheetDialog({
  triggerRef,
  keyword,
  selectedFilters,
  viewportBounds,
  onApplyFilters,
  onClose,
}: SearchFilterSheetDialogProps) {
  const filterSheetRef = useRef<HTMLElement | null>(null)
  const filterCloseButtonRef = useRef<HTMLButtonElement | null>(null)
  const [draftFilters, setDraftFilters] = useState<ShopFilters>(() => ({
    ...selectedFilters,
    workId: undefined,
  }))
  void keyword
  void viewportBounds

  const facetParams = { includeRegions: true, includeCategories: true, includeWorkTypes: false }
  const facetQuery = useQuery({
    queryKey: shopFacetQueryKey(facetParams),
    queryFn: () => getShopFacets(facetParams),
    staleTime: SHOP_FACET_STALE_TIME_MS,
    gcTime: SHOP_FACET_GC_TIME_MS,
  })
  const hasDraftChanges =
    draftFilters.regionIds.join(',') !== selectedFilters.regionIds.join(',') ||
    draftFilters.categoryIds.join(',') !== selectedFilters.categoryIds.join(',')

  const closeFilterSheet = useCallback(() => {
    onClose()
  }, [onClose])

  const applyFilters = () => {
    onApplyFilters({ ...draftFilters, workId: undefined })
    closeFilterSheet()
  }

  const resetFilters = () => {
    setDraftFilters((current) => ({
      ...current,
      regionIds: [],
      categoryIds: [],
      workId: undefined,
    }))
  }

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const filterTriggerElement = triggerRef.current
    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeFilterSheet()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusableControls = Array.from(
        filterSheetRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      )

      if (focusableControls.length === 0) {
        event.preventDefault()
        return
      }

      const firstControl = focusableControls[0]
      const lastControl = focusableControls[focusableControls.length - 1]

      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault()
        lastControl.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault()
        firstControl.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    window.requestAnimationFrame(() => filterCloseButtonRef.current?.focus())

    return () => {
      document.body.style.overflow = previousBodyOverflow
      window.removeEventListener('keydown', handleKeyDown)
      window.setTimeout(() => filterTriggerElement?.focus(), 0)
    }
  }, [closeFilterSheet, triggerRef])

  return (
    <div className="search-filter-layer" role="presentation" onClick={closeFilterSheet}>
      <section
        id="search-filter-sheet"
        className="search-filter-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-filter-title"
        ref={filterSheetRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="search-filter-sheet-head">
          <strong id="search-filter-title">매장 필터</strong>
          <button type="button" ref={filterCloseButtonRef} onClick={closeFilterSheet} aria-label="필터 닫기">
            ×
          </button>
        </div>

        <div className="search-filter-content">
          {facetQuery.isLoading ? <small className="meta-text">필터를 불러오는 중입니다.</small> : null}
          {facetQuery.isError ? <small className="error-text">{(facetQuery.error as Error).message}</small> : null}

          {(facetQuery.data?.regions.length ?? 0) > 0 ? (
            <section className="search-filter-section" aria-labelledby="search-filter-region">
              <h3 id="search-filter-region">지역</h3>
              <ul className="search-filter-chip-list">
                {facetQuery.data?.regions.map((region) => (
                  <li className="search-filter-chip-item" key={region.id}>
                    <button
                      className={`search-filter-chip-button ${
                        draftFilters.regionIds.includes(region.id) ? 'search-filter-chip-selected' : ''
                      }`}
                      type="button"
                      aria-label={region.name}
                      aria-pressed={draftFilters.regionIds.includes(region.id)}
                      onClick={() =>
                        setDraftFilters((current) => ({
                          ...current,
                          regionIds: current.regionIds.includes(region.id)
                            ? current.regionIds.filter((id) => id !== region.id)
                            : [...current.regionIds, region.id],
                        }))
                      }
                    >
                      {region.name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {(facetQuery.data?.categories.length ?? 0) > 0 ? (
            <section className="search-filter-section" aria-labelledby="search-filter-category">
              <h3 id="search-filter-category">카테고리</h3>
              <ul className="search-filter-chip-list">
                {facetQuery.data?.categories.map((category) => (
                  <li className="search-filter-chip-item" key={category.id}>
                    <button
                      className={`search-filter-chip-button ${
                        draftFilters.categoryIds.includes(category.id) ? 'search-filter-chip-selected' : ''
                      }`}
                      type="button"
                      aria-label={category.name}
                      aria-pressed={draftFilters.categoryIds.includes(category.id)}
                      onClick={() =>
                        setDraftFilters((current) => ({
                          ...current,
                          categoryIds: current.categoryIds.includes(category.id)
                            ? current.categoryIds.filter((id) => id !== category.id)
                            : [...current.categoryIds, category.id],
                        }))
                      }
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="search-filter-sheet-actions">
          <Button className="search-filter-action" color="light" size="large" type="button" onClick={resetFilters}>
            선택 초기화
          </Button>
          <Button
            className="search-filter-action search-filter-action-primary"
            color="primary"
            size="large"
            type="button"
            disabled={!hasDraftChanges || !facetQuery.isFetched}
            onClick={applyFilters}
          >
            필터 적용
          </Button>
        </div>
      </section>
    </div>
  )
}
