import { type ReactNode, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, ListRow } from '@aniwhere/tds-mobile'
import { getShopFacets } from '../api/shops'
import type { ShopStatus } from '../api/types'
import { statusToLabel } from '../lib/format'
import { toShopFacetParams, type ShopFilters } from '../lib/shopFilters'

type SearchFilterSheetProps = {
  open: boolean
  triggerRef: RefObject<HTMLElement>
  keyword?: string
  selectedFilters: ShopFilters
  onApplyFilters: (filters: ShopFilters) => void
  onClose: () => void
}

type SearchFilterSheetDialogProps = Omit<SearchFilterSheetProps, 'open'>

type CountedOption = {
  id: number
  name: string
  disabled: boolean
  count: number
}

type StatusOption = {
  value: ShopStatus
  label: string
  disabled: boolean
  count: number
}

const EMPTY_FILTERS: ShopFilters = {
  categoryIds: [],
}

const FALLBACK_STATUS_OPTIONS: StatusOption[] = [
  { value: 'ACTIVE', label: statusToLabel('ACTIVE'), disabled: false, count: 0 },
  { value: 'CLOSED', label: statusToLabel('CLOSED'), disabled: false, count: 0 },
  { value: 'UNVERIFIED', label: statusToLabel('UNVERIFIED'), disabled: false, count: 0 },
]

function sameIdList(left: number[], right: number[]) {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function areFiltersEqual(left: ShopFilters, right: ShopFilters) {
  return (
    left.regionId === right.regionId &&
    sameIdList(left.categoryIds, right.categoryIds) &&
    left.workId === right.workId &&
    left.status === right.status
  )
}

function countLabel(count: number) {
  return count > 0 ? `${count.toLocaleString()}곳` : '결과 없음'
}

function FilterSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="search-filter-section" aria-labelledby={id}>
      <h3 id={id}>{title}</h3>
      {children}
    </section>
  )
}

function CountBadge({ count }: { count: number }) {
  return <small className="search-filter-option-count">{countLabel(count)}</small>
}

export function SearchFilterSheet({
  open,
  ...props
}: SearchFilterSheetProps) {
  if (!open) {
    return null
  }

  const draftKey = [
    props.selectedFilters.regionId ?? '',
    props.selectedFilters.categoryIds.join(','),
    props.selectedFilters.workId ?? '',
    props.selectedFilters.status ?? '',
  ].join('|')

  return <SearchFilterSheetDialog key={draftKey} {...props} />
}

function SearchFilterSheetDialog({
  triggerRef,
  keyword,
  selectedFilters,
  onApplyFilters,
  onClose,
}: SearchFilterSheetDialogProps) {
  const filterSheetRef = useRef<HTMLElement | null>(null)
  const filterCloseButtonRef = useRef<HTMLButtonElement | null>(null)
  const [draftFilters, setDraftFilters] = useState<ShopFilters>(selectedFilters)
  const facetParams = useMemo(
    () => toShopFacetParams(draftFilters, { keyword: keyword?.trim() || undefined }),
    [draftFilters, keyword],
  )
  const facetQuery = useQuery({
    queryKey: ['shops', 'filter-facets', facetParams],
    queryFn: () => getShopFacets(facetParams),
    staleTime: 1000 * 60,
  })
  const statusOptions = facetQuery.data?.statuses.length ? facetQuery.data.statuses : FALLBACK_STATUS_OPTIONS
  const hasDraftChanges = !areFiltersEqual(draftFilters, selectedFilters)

  const closeFilterSheet = useCallback(() => {
    onClose()
  }, [onClose])

  const applyFilters = () => {
    onApplyFilters(draftFilters)
    closeFilterSheet()
  }

  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS)
  }

  const selectRegion = (regionId: number) => {
    setDraftFilters((current) => ({
      ...current,
      regionId: current.regionId === regionId ? undefined : regionId,
    }))
  }

  const toggleCategory = (categoryId: number) => {
    setDraftFilters((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }))
  }

  const selectWork = (workId: number) => {
    setDraftFilters((current) => ({
      ...current,
      workId: current.workId === workId ? undefined : workId,
    }))
  }

  const selectStatus = (status: ShopStatus) => {
    setDraftFilters((current) => ({
      ...current,
      status: current.status === status ? undefined : status,
    }))
  }

  const renderOption = ({
    option,
    selected,
    onClick,
  }: {
    option: CountedOption
    selected: boolean
    onClick: () => void
  }) => (
    <ListRow
      border="none"
      className="search-filter-option-row"
      contents={
        <button
          className={`search-filter-option-button ${selected ? 'search-filter-option-selected' : ''}`}
          type="button"
          disabled={option.disabled}
          aria-pressed={selected}
          onClick={onClick}
        >
          <span>{option.name}</span>
          <CountBadge count={option.count} />
        </button>
      }
      key={option.id}
      verticalPadding="small"
    />
  )

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
            <FilterSection id="search-filter-region" title="지역">
              <ul className="search-filter-option-list">
                {facetQuery.data?.regions.map((region) =>
                  renderOption({
                    option: region,
                    selected: draftFilters.regionId === region.id,
                    onClick: () => selectRegion(region.id),
                  }),
                )}
              </ul>
            </FilterSection>
          ) : null}

          {(facetQuery.data?.categories.length ?? 0) > 0 ? (
            <FilterSection id="search-filter-category" title="카테고리">
              <ul className="search-filter-option-list">
                {facetQuery.data?.categories.map((category) =>
                  renderOption({
                    option: category,
                    selected: draftFilters.categoryIds.includes(category.id),
                    onClick: () => toggleCategory(category.id),
                  }),
                )}
              </ul>
            </FilterSection>
          ) : null}

          {(facetQuery.data?.works.length ?? 0) > 0 ? (
            <FilterSection id="search-filter-work" title="작품">
              <ul className="search-filter-option-list">
                {facetQuery.data?.works.map((work) =>
                  renderOption({
                    option: work,
                    selected: draftFilters.workId === work.id,
                    onClick: () => selectWork(work.id),
                  }),
                )}
              </ul>
            </FilterSection>
          ) : null}

          <FilterSection id="search-filter-status" title="영업 상태">
            <ul className="search-filter-option-list">
              {statusOptions.map((status) => (
                <ListRow
                  border="none"
                  className="search-filter-option-row"
                  contents={
                    <button
                      className={`search-filter-option-button ${
                        draftFilters.status === status.value ? 'search-filter-option-selected' : ''
                      }`}
                      type="button"
                      disabled={status.disabled}
                      aria-pressed={draftFilters.status === status.value}
                      onClick={() => selectStatus(status.value)}
                    >
                      <span>{status.label}</span>
                      <CountBadge count={status.count} />
                    </button>
                  }
                  key={status.value}
                  verticalPadding="small"
                />
              ))}
            </ul>
          </FilterSection>
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
            disabled={!hasDraftChanges && !facetQuery.isFetched}
            onClick={applyFilters}
          >
            필터 적용
          </Button>
        </div>
      </section>
    </div>
  )
}
