import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { requestCurrentLocation } from '../shared/lib/location'
import {
  clearRecentSearches,
  pushRecentSearch,
  readRecentSearches,
  removeRecentSearch,
} from '../shared/lib/searchHistory'
import {
  countShopFilters,
  parseShopFilters,
  writeShopFilters,
  type ShopFilters,
} from '../shared/lib/shopFilters'
import { isAppsInTossRuntime } from '../shared/lib/auth'
import { AppTopNavigation } from '../shared/ui/AppTopNavigation'
import { MapSearchFieldForm } from '../shared/ui/MapSearchFieldShell'
import { SearchFilterSheet } from '../shared/ui/SearchFilterSheet'
import searchLocationGuideUrl from '../assets/search-location-guide.webp'
import { buildNearbyExploreHref } from './searchNearby'

type SearchScope = 'shop' | 'work'

function readSafeReturnTo(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : null
}

function buildExploreSearchHref({
  keyword,
  scope,
  selectedFilters,
}: {
  keyword: string
  scope: SearchScope
  selectedFilters: ShopFilters
}) {
  const trimmed = keyword.trim()
  const next = writeShopFilters(new URLSearchParams(), selectedFilters)

  next.set('view', 'list')

  if (scope === 'work') {
    next.set('scope', 'work')
  }

  if (trimmed) {
    next.set('keyword', trimmed)
  }

  return `/explore?${next.toString()}`
}

export function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const currentSearchScope = searchParams.get('scope') === 'work' ? 'work' : 'shop'
  const currentKeyword = searchParams.get('keyword') ?? ''
  const selectedFilters = useMemo(() => parseShopFilters(searchParams), [searchParams])
  const safeReturnTo = readSafeReturnTo(searchParams.get('returnTo'))
  const [keyword, setKeyword] = useState(currentKeyword)
  const [recentSearches, setRecentSearches] = useState(() => readRecentSearches())
  const [nearbyState, setNearbyState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [nearbyError, setNearbyError] = useState<string | null>(null)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null)
  const appliedFilterCount = countShopFilters(selectedFilters)
  const usesTossNavigation = useMemo(() => isAppsInTossRuntime(), [])

  useEffect(() => {
    setKeyword(currentKeyword)
  }, [currentKeyword])

  const closeFilterSheet = useCallback(() => {
    setIsFilterSheetOpen(false)
  }, [])

  const submitSearchToExplore = (nextKeyword: string) => {
    const trimmed = nextKeyword.trim()

    if (trimmed) {
      setRecentSearches(pushRecentSearch(trimmed))
    }

    navigate(buildExploreSearchHref({ keyword: trimmed, scope: currentSearchScope, selectedFilters }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitSearchToExplore(keyword)
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) {
      return
    }

    event.preventDefault()
    submitSearchToExplore(keyword)
  }

  const handleSearchBack = () => {
    if (safeReturnTo) {
      navigate(safeReturnTo, { replace: true })
      return
    }

    navigate(-1)
  }

  const applyFilters = (nextFilters: ShopFilters) => {
    navigate(buildExploreSearchHref({ keyword, scope: currentSearchScope, selectedFilters: nextFilters }))
  }

  const removeRecentSearchItem = (item: string) => {
    setRecentSearches(removeRecentSearch(item))
  }

  const clearAllRecentSearches = () => {
    setRecentSearches(clearRecentSearches())
  }

  const handleNearbySearch = async () => {
    if (nearbyState === 'loading') {
      return
    }

    setNearbyState('loading')
    setNearbyError(null)

    try {
      const currentLocation = await requestCurrentLocation()
      navigate(buildNearbyExploreHref(currentLocation))
    } catch (error) {
      setNearbyState('error')
      setNearbyError(error instanceof Error ? error.message : '현재 위치를 가져오지 못했습니다.')
    }
  }

  return (
    <main className="map-page-shell">
      <section className="map-page map-page-list-mode">
        <div
          className={[
            'map-list-view',
            usesTossNavigation ? 'map-surface-toss-navigation' : 'map-surface-local-navigation',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {!usesTossNavigation ? (
            <AppTopNavigation className="map-route-navigation" showBack onBack={handleSearchBack} />
          ) : null}

          <div className="map-list-view-top">
            <div className="map-search-row search-screen-toolrow">
              <MapSearchFieldForm
                autoFocus
                value={keyword}
                onChange={setKeyword}
                onClear={() => setKeyword('')}
                onKeyDown={handleSearchKeyDown}
                onSubmit={handleSubmit}
              />

              <button
                className="search-filter-button map-filter-button"
                type="button"
                ref={filterTriggerRef}
                onClick={() => setIsFilterSheetOpen(true)}
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
          </div>

          <SearchFilterSheet
            open={isFilterSheetOpen}
            triggerRef={filterTriggerRef}
            keyword={currentKeyword}
            selectedFilters={selectedFilters}
            onApplyFilters={applyFilters}
            onClose={closeFilterSheet}
          />

          <section className="map-results-list-panel" aria-label="검색">
            <div className="map-results-sheet-list search-route-precontent">
              <section className="search-history-section">
                <div className="search-history-head">
                  <strong>최근 검색어</strong>
                  {recentSearches.length > 0 ? (
                    <button className="search-history-clear-all" type="button" onClick={clearAllRecentSearches}>
                      전체 삭제
                    </button>
                  ) : null}
                </div>

                {recentSearches.length > 0 ? (
                  <div className="search-history-chip-list">
                    {recentSearches.map((item) => (
                      <span className="search-history-chip" key={item}>
                        <button
                          className="search-history-chip-label"
                          type="button"
                          onClick={() => submitSearchToExplore(item)}
                        >
                          <span>{item}</span>
                        </button>
                        <button
                          className="search-history-chip-remove applied-filter-chip-close"
                          type="button"
                          aria-label={`${item} 삭제`}
                          onClick={() => removeRecentSearchItem(item)}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="search-history-empty">
                    <strong>최근 검색 기록이 없습니다.</strong>
                    <small>매장, 지역, 작품 이름으로 찾을 수 있어요.</small>
                  </div>
                )}
              </section>

              <section className="search-location-card" aria-labelledby="search-location-title">
                <div className="search-location-visual" aria-hidden="true">
                  <img className="search-location-image" src={searchLocationGuideUrl} alt="" />
                </div>
                <div className="search-location-copy">
                  <strong id="search-location-title">
                    현위치에서 가까운 매장을
                    <br />
                    찾아볼까요?
                  </strong>
                </div>
                <button
                  className="search-location-button"
                  disabled={nearbyState === 'loading'}
                  type="button"
                  onClick={handleNearbySearch}
                >
                  {nearbyState === 'loading' ? '위치 확인 중' : '가까운 매장 찾기'}
                </button>
                {nearbyError ? <small className="search-location-error">{nearbyError}</small> : null}
              </section>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
