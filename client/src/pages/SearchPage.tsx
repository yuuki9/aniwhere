import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Asset } from '@aniwhere/tds-mobile'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { recordPopularityEventSafely } from '../shared/api/popularity'
import { getMixedEntityRankings } from '../shared/api/rankings'
import { getSearchAutocomplete } from '../shared/api/search'
import type { SearchAutocompleteItem, SearchAutocompleteKind, SearchAutocompleteScope } from '../shared/api/types'
import { requestCurrentLocation } from '../shared/lib/location'
import {
  clearRecentSearchEntries,
  pushRecentSearchEntry,
  readRecentSearchEntries,
  removeRecentSearchEntry,
  type RecentSearchEntry,
  type RecentSearchKind,
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
import {
  buildTrendPreviewItems,
  normalizeMixedEntityRankingItem,
} from './trendRankingViewModel'
import { TrendRankingPanel } from './TrendRankingPanel'

type SearchScope = SearchAutocompleteScope
type SearchAutocompleteIconKind = SearchAutocompleteKind | 'RECENT'
type SearchAutocompleteSuggestion = SearchAutocompleteItem & { scope: SearchScope }
type SearchAutocompleteGroup = {
  kind: SearchAutocompleteKind
  items: SearchAutocompleteSuggestion[]
}

function toPopularityScope(scope: SearchScope) {
  return scope === 'work' ? 'WORK' : 'SHOP'
}

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
  selectedFilters?: ShopFilters
}) {
  const trimmed = keyword.trim()
  const next = selectedFilters ? writeShopFilters(new URLSearchParams(), selectedFilters) : new URLSearchParams()

  next.set('view', 'list')

  if (scope === 'work') {
    next.set('scope', 'work')
  }

  if (trimmed) {
    next.set('keyword', trimmed)
  }

  return `/explore?${next.toString()}`
}

function getRecentSearchKindLabel(kind: RecentSearchKind) {
  return kind === 'work' ? '작품' : '매장'
}

function getAutocompleteGroupTitle(kind: SearchAutocompleteKind) {
  return kind === 'WORK' ? '작품명' : '매장명'
}

function getAutocompleteIconName(kind: SearchAutocompleteIconKind) {
  if (kind === 'RECENT') {
    return 'icon-clock-mono'
  }

  return kind === 'WORK' ? 'icon-book-opened-mono' : 'icon-store-roof-mono'
}

function getAutocompleteIconSize(kind: SearchAutocompleteIconKind) {
  return kind === 'WORK' ? 18 : 20
}

function SearchAutocompleteLeadingIcon({ kind }: { kind: SearchAutocompleteIconKind }) {
  const iconSize = getAutocompleteIconSize(kind)

  return (
    <span className={`search-autocomplete-leading-icon search-autocomplete-leading-icon-${kind.toLowerCase()}`} aria-hidden="true">
      <Asset.Icon name={getAutocompleteIconName(kind)} color="currentColor" frameShape={{ width: iconSize, height: iconSize }} />
    </span>
  )
}

export function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const currentSearchScope = searchParams.get('scope') === 'work' ? 'work' : 'shop'
  const currentKeyword = searchParams.get('keyword') ?? ''
  const selectedFilters = useMemo(() => parseShopFilters(searchParams), [searchParams])
  const safeReturnTo = readSafeReturnTo(searchParams.get('returnTo'))
  const [keyword, setKeyword] = useState(currentKeyword)
  const [recentSearches, setRecentSearches] = useState(() => readRecentSearchEntries())
  const [nearbyState, setNearbyState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [nearbyError, setNearbyError] = useState<string | null>(null)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null)
  const appliedFilterCount = countShopFilters(selectedFilters)
  const usesTossNavigation = useMemo(() => isAppsInTossRuntime(), [])
  const compactKeyword = keyword.trim()
  const normalizedCompactKeyword = compactKeyword.toLocaleLowerCase()
  const isComposingSearch = compactKeyword.length > 0
  const autocompleteScopes: SearchScope[] = currentSearchScope === 'work' ? ['work', 'shop'] : ['shop', 'work']
  const autocompleteQuery = useQuery<SearchAutocompleteSuggestion[]>({
    queryKey: ['search-autocomplete', currentSearchScope, compactKeyword],
    queryFn: async () => {
      const results = await Promise.allSettled(
        autocompleteScopes.map((scope) => getSearchAutocomplete({ q: compactKeyword, scope, limit: 5 })),
      )

      return results.flatMap((result, index) => {
        if (result.status !== 'fulfilled') {
          return []
        }

        const scope = autocompleteScopes[index]

        return result.value.items.map((item) => ({ ...item, scope }))
      })
    },
    enabled: compactKeyword.length > 0,
    staleTime: 30_000,
  })
  const trendRankingQuery = useQuery({
    queryKey: ['rankings', 'search-mixed-entities', '7d', 10],
    queryFn: () => getMixedEntityRankings({ window: '7d', limit: 10 }),
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
  const autocompleteSuggestions = autocompleteQuery.data ?? []
  const trendItems = useMemo(
    () => buildTrendPreviewItems((trendRankingQuery.data?.items ?? []).map(normalizeMixedEntityRankingItem), 10),
    [trendRankingQuery.data?.items],
  )
  const autocompleteGroupKinds: SearchAutocompleteKind[] = currentSearchScope === 'work' ? ['WORK', 'SHOP'] : ['SHOP', 'WORK']
  const autocompleteGroups: SearchAutocompleteGroup[] = autocompleteGroupKinds
    .map((kind) => ({
      kind,
      items: autocompleteSuggestions.filter((item) => item.kind === kind),
    }))
    .filter((group) => group.items.length > 0)
  const relatedRecentSearches = recentSearches
    .filter((item) => item.keyword.trim().toLocaleLowerCase().includes(normalizedCompactKeyword))
    .slice(0, 3)

  useEffect(() => {
    setKeyword(currentKeyword)
  }, [currentKeyword])

  const closeFilterSheet = useCallback(() => {
    setIsFilterSheetOpen(false)
  }, [])

  const submitSearchToExplore = (
    nextKeyword: string,
    nextScope: SearchScope = 'shop',
    recentKind?: RecentSearchKind,
    selectedSuggestion?: SearchAutocompleteSuggestion,
  ) => {
    const trimmed = nextKeyword.trim()

    if (trimmed) {
      setRecentSearches(pushRecentSearchEntry(trimmed, recentKind))
    }

    if (trimmed && selectedSuggestion == null) {
      recordPopularityEventSafely({
        type: 'SEARCH_KEYWORD_SUBMITTED',
        keyword: trimmed,
        scope: toPopularityScope(nextScope),
      })
    }

    if (selectedSuggestion?.shopId != null || selectedSuggestion?.workId != null) {
      recordPopularityEventSafely({
        type: 'SEARCH_AUTOCOMPLETE_SELECTED',
        ...(selectedSuggestion.shopId != null ? { shopId: selectedSuggestion.shopId } : {}),
        ...(selectedSuggestion.workId != null ? { workId: selectedSuggestion.workId } : {}),
      })
    }

    navigate(buildExploreSearchHref({ keyword: trimmed, scope: nextScope }))
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
    navigate(buildExploreSearchHref({ keyword, scope: currentSearchScope, selectedFilters: nextFilters }), { replace: true })
  }

  const removeRecentSearchItem = (item: RecentSearchEntry) => {
    setRecentSearches(removeRecentSearchEntry(item))
  }

  const clearAllRecentSearches = () => {
    setRecentSearches(clearRecentSearchEntries())
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
                value={keyword}
                onChange={setKeyword}
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
            keyword={keyword}
            selectedFilters={selectedFilters}
            onApplyFilters={applyFilters}
            onClose={closeFilterSheet}
          />

          <section className="map-results-list-panel" aria-label="검색">
            <div className="map-results-sheet-list search-route-precontent">
              {isComposingSearch ? (
                <section className="search-autocomplete-panel" aria-label="검색어 자동완성">
                  {relatedRecentSearches.length > 0 ? (
                    <section className="search-autocomplete-history" aria-label="관련 최근 검색어">
                      <strong className="search-autocomplete-group-title">최근 검색어</strong>
                      <ul className="search-autocomplete-list">
                        {relatedRecentSearches.map((item) => (
                          <li key={`${item.kind ?? 'keyword'}-${item.keyword}`}>
                            <button
                              className="search-autocomplete-history-item"
                              type="button"
                              onClick={() => submitSearchToExplore(item.keyword, item.kind ?? 'shop', item.kind)}
                            >
                              <span className="search-autocomplete-item-main">
                                <SearchAutocompleteLeadingIcon kind="RECENT" />
                                <span className="search-autocomplete-label">{item.keyword}</span>
                              </span>
                              {item.kind ? <span className="search-history-chip-kind">{getRecentSearchKindLabel(item.kind)}</span> : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {autocompleteGroups.map((group) => (
                    <section className="search-autocomplete-group" key={group.kind} aria-label={getAutocompleteGroupTitle(group.kind)}>
                      <strong className="search-autocomplete-group-title">{getAutocompleteGroupTitle(group.kind)}</strong>
                      <ul className="search-autocomplete-list">
                        {group.items.map((item) => (
                          <li key={`${item.kind}-${item.shopId ?? item.workId ?? item.label}`}>
                            <button
                              className="search-autocomplete-item"
                              type="button"
                              onClick={() =>
                                submitSearchToExplore(item.label, item.scope, item.kind === 'WORK' ? 'work' : 'shop', item)
                              }
                            >
                              <span className="search-autocomplete-item-main">
                                <SearchAutocompleteLeadingIcon kind={item.kind} />
                                <strong className="search-autocomplete-label">{item.label}</strong>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </section>
              ) : (
                <>
                  {recentSearches.length > 0 ? (
                    <section className="search-history-section">
                      <div className="search-history-head">
                        <strong>최근 검색어</strong>
                        <button className="search-history-clear-all" type="button" onClick={clearAllRecentSearches}>
                          전체 삭제
                        </button>
                      </div>
                      <div className="search-history-chip-list">
                        {recentSearches.map((item) => (
                          <span className="search-history-chip" key={`${item.kind ?? 'keyword'}-${item.keyword}`}>
                            <button
                              className="search-history-chip-label"
                              type="button"
                              onClick={() => submitSearchToExplore(item.keyword, item.kind ?? 'shop', item.kind)}
                            >
                              {item.kind ? <span className="search-history-chip-kind">{getRecentSearchKindLabel(item.kind)}</span> : null}
                              <span className="search-history-chip-text">{item.keyword}</span>
                            </button>
                            <button
                              className="search-history-chip-remove applied-filter-chip-close"
                              type="button"
                              aria-label={`${item.keyword} 삭제`}
                              onClick={() => removeRecentSearchItem(item)}
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {trendItems.length > 0 ? (
                    <section className="search-trend-rank-section" aria-label="인기 검색어">
                      <TrendRankingPanel items={trendItems} returnTo="/search" />
                    </section>
                  ) : null}

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
                </>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
