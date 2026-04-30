import { type FormEvent, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getShops } from '../shared/api/shops'
import { formatRelativeUpdated } from '../shared/lib/format'
import { pushRecentSearch, readRecentSearches } from '../shared/lib/searchHistory'
import { GlobalNavigationMenu } from '../shared/ui/GlobalNavigationMenu'
import { StatusPill } from '../shared/ui/StatusPill'

const SEARCH_PAGE_SIZE = 8

export function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentKeyword = searchParams.get('keyword') ?? ''
  const currentPage = Number(searchParams.get('page') ?? '0')
  const [keyword, setKeyword] = useState(currentKeyword)
  const [recentSearches, setRecentSearches] = useState(() => readRecentSearches())

  const facetQuery = useQuery({
    queryKey: ['shops', 'search-page-facets'],
    queryFn: () => getShops({ page: 0, size: 200 }),
  })

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

  const allShops = useMemo(() => facetQuery.data?.content ?? [], [facetQuery.data?.content])

  const quickKeywords = useMemo(() => {
    const counts = new Map<string, number>()

    for (const shop of allShops) {
      for (const categoryName of shop.categories) {
        counts.set(categoryName, (counts.get(categoryName) ?? 0) + 1)
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name)
  }, [allShops])

  const moveToSearch = (nextKeyword: string, nextPage = 0) => {
    const trimmed = nextKeyword.trim()
    const next = new URLSearchParams()

    if (trimmed) {
      next.set('keyword', trimmed)
      setRecentSearches(pushRecentSearch(trimmed))
    }

    next.set('page', String(nextPage))
    setSearchParams(next)
    setKeyword(trimmed)
  }

  const buildExploreHref = (shopId: number, shopRegionId: number | null) => {
    const next = new URLSearchParams()
    next.set('page', '0')

    if (shopRegionId) {
      next.set('regionId', String(shopRegionId))
    }

    next.set('shopId', String(shopId))
    return `/explore?${next.toString()}`
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    moveToSearch(keyword)
  }

  const movePage = (nextPage: number) => {
    moveToSearch(currentKeyword, nextPage)
  }

  return (
    <main className="search-screen-shell">
      <section className="search-screen search-screen-v2">
        <div className="search-screen-top search-screen-top-v2">
          <div className="search-screen-topbar-row">
          <form className="search-screen-bar" onSubmit={handleSubmit}>
            <button className="search-screen-icon" type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
              ‹
            </button>

            <input
              autoFocus
              aria-label="검색어 입력"
              className="search-screen-input"
              placeholder="장소 검색"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />

            <button className="search-screen-icon" type="submit" aria-label="검색 실행">
              ⌕
            </button>
          </form>
            <GlobalNavigationMenu triggerClassName="global-nav-trigger global-nav-trigger-inline" />
          </div>
        </div>

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
                      <span aria-hidden="true">◷</span>
                      <strong>{item}</strong>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="search-history-empty">
                  <p>최근 검색 기록이 없습니다.</p>
                </div>
              )}
            </section>

            {quickKeywords.length > 0 ? (
              <section className="search-history-section">
                <div className="search-history-head">
                  <strong>추천 키워드</strong>
                </div>

                <div className="map-chip-scroll">
                  {quickKeywords.map((item) => (
                    <button className="map-chip-filter" key={item} type="button" onClick={() => moveToSearch(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="search-screen-content search-screen-content-v2">
            {resultQuery.isLoading ? <p className="meta-text">검색 결과를 불러오는 중입니다.</p> : null}
            {resultQuery.isError ? <p className="error-text">{(resultQuery.error as Error).message}</p> : null}

            <div className="map-list-header map-list-header-v2">
              <strong>{resultQuery.data?.totalElements ?? 0}곳</strong>
              <div className="map-sheet-controls">
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
            </div>

            {resultQuery.data?.content.length === 0 ? (
              <div className="search-history-empty">
                <p>검색 결과가 없습니다.</p>
              </div>
            ) : null}

            <div className="map-list-results">
              {(resultQuery.data?.content ?? []).map((shop) => (
                <article className="map-list-item map-list-item-v2" key={shop.id}>
                  <button
                    className="map-list-select"
                    type="button"
                    onClick={() => navigate(buildExploreHref(shop.id, shop.regionId))}
                  >
                    <div className="map-list-item-head">
                      <strong>{shop.name}</strong>
                      <StatusPill status={shop.status} />
                    </div>
                    <p>
                      {shop.regionName ?? `지역 ${shop.regionId ?? '-'}`} · 작품 {shop.works.length}
                    </p>
                    <p className="map-list-item-subtle">{shop.address}</p>
                    <p className="map-list-item-subtle">{formatRelativeUpdated(shop.updatedAt)}</p>
                  </button>

                  <div className="shop-action-group">
                    <Link className="ghost-action compact-action" to={buildExploreHref(shop.id, shop.regionId)}>
                      지도 보기
                    </Link>
                    <Link className="primary-action compact-action" to={buildExploreHref(shop.id, shop.regionId)}>
                      상세 보기
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
