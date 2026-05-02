import { type FormEvent, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getShops } from '../shared/api/shops'
import type { Shop } from '../shared/api/types'
import { formatRelativeUpdated } from '../shared/lib/format'
import { requestCurrentLocation } from '../shared/lib/location'
import { pushRecentSearch, readRecentSearches } from '../shared/lib/searchHistory'
import { StatusPill } from '../shared/ui/StatusPill'
import searchLocationGuideUrl from '../assets/search-location-guide.webp'
import { buildNearbyExploreHref } from './searchNearby'

const SEARCH_PAGE_SIZE = 8

const buildExploreHref = (shopId: number, shopRegionId: number | null) => {
  const next = new URLSearchParams()
  next.set('page', '0')

  if (shopRegionId) {
    next.set('regionId', String(shopRegionId))
  }

  next.set('shopId', String(shopId))
  return `/explore?${next.toString()}`
}

const buildShopMeta = (shop: Shop) =>
  [shop.regionName, ...shop.categories.slice(0, 2), shop.sellsIchibanKuji ? '이치방쿠지' : null]
    .filter(Boolean)
    .join(' · ')

const buildShopAddress = (shop: Shop) => [shop.address, shop.floor].filter(Boolean).join(' · ')

export function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentKeyword = searchParams.get('keyword') ?? ''
  const currentPage = Number(searchParams.get('page') ?? '0')
  const [keyword, setKeyword] = useState(currentKeyword)
  const [recentSearches, setRecentSearches] = useState(() => readRecentSearches())
  const [nearbyState, setNearbyState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [nearbyError, setNearbyError] = useState<string | null>(null)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const appliedFilterCount = 0

  const resultQuery = useQuery({
    queryKey: ['shops', 'search-page-results', currentKeyword, currentPage],
    queryFn: () =>
      getShops({
        page: currentPage,
        size: SEARCH_PAGE_SIZE,
        keyword: currentKeyword || undefined,
      }),
    placeholderData: keepPreviousData,
    enabled: currentKeyword.trim().length > 0,
  })

  const moveToSearch = (nextKeyword: string, nextPage = 0) => {
    const trimmed = nextKeyword.trim()
    const next = new URLSearchParams()

    if (trimmed) {
      next.set('keyword', trimmed)
      setRecentSearches(pushRecentSearch(trimmed))
    }

    next.set('page', String(nextPage))
    setSearchParams(next, { replace: true })
    setKeyword(trimmed)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    moveToSearch(keyword)
  }

  const movePage = (nextPage: number) => {
    moveToSearch(currentKeyword, nextPage)
  }

  const handleSearchBack = () => {
    if (currentKeyword.trim()) {
      setSearchParams(new URLSearchParams(), { replace: true })
      setKeyword('')
      return
    }

    navigate(-1)
  }

  const handleNearbySearch = async () => {
    if (nearbyState === 'loading') {
      return
    }

    setNearbyState('loading')
    setNearbyError(null)

    try {
      const location = await requestCurrentLocation()
      navigate(buildNearbyExploreHref(location))
    } catch (error) {
      setNearbyState('error')
      setNearbyError(error instanceof Error ? error.message : '현재 위치를 가져오지 못했습니다.')
    }
  }

  return (
    <main className="search-screen-shell">
      <section className="search-screen search-screen-v2">
        <header className="search-screen-top search-screen-top-v2">
          <div className="search-page-titlebar">
            <button className="search-screen-icon" type="button" onClick={handleSearchBack} aria-label="뒤로가기">
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path d="M15 5 8 12l7 7" />
              </svg>
            </button>
            <strong className="search-page-title">검색</strong>
            <div aria-hidden="true" />
          </div>

          <div className="search-screen-toolrow">
            <form className="search-screen-bar" onSubmit={handleSubmit}>
              <input
                autoFocus
                aria-label="검색어 입력"
                className="search-screen-input"
                placeholder="매장, 지역, 작품 이름 검색"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />

              <button className="search-screen-icon" type="submit" aria-label="검색 실행">
                <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="6" />
                  <path d="m16 16 4 4" />
                </svg>
              </button>
            </form>

            <button
              className="search-filter-button"
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
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
        </header>

        {isFilterSheetOpen ? (
          <div className="search-filter-layer" role="presentation" onClick={() => setIsFilterSheetOpen(false)}>
            <section
              className="search-filter-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="search-filter-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="search-filter-sheet-head">
                <strong id="search-filter-title">매장 필터</strong>
                <button type="button" onClick={() => setIsFilterSheetOpen(false)} aria-label="필터 닫기">
                  ×
                </button>
              </div>

              <div className="search-filter-pending">
                <strong>필터 항목 준비 중</strong>
                <small>facet API가 연결되면 지역, 카테고리, 영업 상태 기준으로 검색 결과를 좁힐 수 있어요.</small>
              </div>

              <div className="search-filter-sheet-actions">
                <button type="button" disabled>
                  선택 초기화
                </button>
                <button type="button" disabled>
                  필터 적용
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {!currentKeyword ? (
          <div className="search-screen-content search-screen-content-v2">
            <section className="search-history-section">
              <div className="search-history-head">
                <strong>최근 검색어</strong>
              </div>

              {recentSearches.length > 0 ? (
                <div className="search-history-list">
                  {recentSearches.map((item) => (
                    <button className="search-history-item" key={item} type="button" onClick={() => moveToSearch(item)}>
                      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="7" />
                        <path d="M12 8v4l3 2" />
                      </svg>
                      <strong>{item}</strong>
                    </button>
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
                  내 위치에서 가까운 매장을
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
        ) : (
          <div className="search-screen-content search-screen-content-v2">
            {resultQuery.isLoading ? <small className="meta-text">검색 결과를 불러오는 중입니다.</small> : null}
            {resultQuery.isError ? <small className="error-text">{(resultQuery.error as Error).message}</small> : null}

            <div className="search-result-head">
              <strong>매장 목록</strong>
              <small>{resultQuery.data?.totalElements ?? 0}곳</small>
            </div>

            {resultQuery.data?.content.length === 0 ? (
              <div className="search-history-empty">
                <strong>검색 결과가 없습니다.</strong>
                <small>다른 매장, 지역, 작품 이름으로 다시 검색해보세요.</small>
              </div>
            ) : null}

            <div className="search-result-list">
              {(resultQuery.data?.content ?? []).map((shop) => {
                const shopMeta = buildShopMeta(shop)
                const shopAddress = buildShopAddress(shop)

                return (
                  <article className="search-result-card" key={shop.id}>
                    <Link className="search-result-link" to={buildExploreHref(shop.id, shop.regionId)}>
                      <div className="search-result-body">
                        <div className="search-result-name">
                          <strong>{shop.name}</strong>
                          <StatusPill status={shop.status} />
                        </div>
                        {shopMeta ? <small className="search-result-meta">{shopMeta}</small> : null}
                        <small className="search-result-address">{shopAddress}</small>
                        <small className="search-result-updated">{formatRelativeUpdated(shop.updatedAt)}</small>
                      </div>
                    </Link>
                  </article>
                )
              })}
            </div>

            {resultQuery.data && resultQuery.data.totalPages > 1 ? (
              <div className="search-result-pager">
                <button
                  className="ghost-action compact-action"
                  disabled={currentPage === 0}
                  type="button"
                  onClick={() => movePage(currentPage - 1)}
                >
                  이전
                </button>
                <button
                  className="ghost-action compact-action"
                  disabled={resultQuery.data?.last}
                  type="button"
                  onClick={() => movePage(currentPage + 1)}
                >
                  다음
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  )
}
